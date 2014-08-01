### Log.io Web Client

Listens to server for new log messages, renders them to screen "widgets".

# Usage:
wclient = new WebClient io, host: 'http://localhost:28778'
screen = wclient.createScreen
stream = wclient.logStreams.at 0
node = wclient.logNodes.at 0
screen.addPair stream, node
screen.on 'new_log', (stream, node, level, message) ->

###

if process.browser
  $ = require 'jquery-browserify'
else
  $ = eval "require('jquery')"
backbone = require 'backbone'
backbone.$ = $
io = require 'socket.io-client'
_ = require 'underscore'
templates = require './templates'

# Cap LogMessages collection size
MESSAGE_CAP = 5000

###
ColorManager acts as a circular queue for color values.
Every new Stream or Node is assigned a color value on instantiation.

###

class ColorManager
  _max: 20
  constructor: (@_index=1) ->
  next: ->
    @_index = 1 if @_index is @_max
    @_index++;

colors = new ColorManager

###
Backbone models are used to represent nodes and streams.  When nodes
go offline, their LogNode model is destroyed, along with their
stream assocations.

###

class _LogObject extends backbone.Model
  idAttribute: 'name'
  _pclass: -> new _LogObjects
  sync: (args...) ->
  constructor: (args...) ->
    super args...
    @screens = new LogScreens
    @pairs = @_pclass()
    @color = colors.next()

class _LogObjects extends backbone.Collection
  model: _LogObject
  comparator: (obj) ->
    obj.get 'name'

class LogStream extends _LogObject
  _pclass: -> new LogNodes

class LogStreams extends _LogObjects
  model: LogStream

class LogNode extends _LogObject
  _pclass: -> new LogStreams

class LogNodes extends _LogObjects
  model: LogNode

class LogMessage extends backbone.Model
  ROPEN = new RegExp '<','ig'
  RCLOSE = new RegExp '>','ig'
  render_message: ->
    @get('message').replace(ROPEN, '&lt;').replace(RCLOSE, '&gt;')

class LogMessages extends backbone.Collection
  model: LogMessage
  constructor: (args...) ->
    super args...
    @on 'add', @_capped

  _capped: =>
    @remove @at (@length - MESSAGE_CAP) if @length > MESSAGE_CAP


###
LogScreen models maintain state for screen widgets in the UI.
When (Stream, Node) pairs are associated with a screen, the pair ID
is stored on the model.  It uses pair ID instead of models themselves
in case a node goes offline, and a new LogNode model is created.

###
class LogScreen extends backbone.Model
  idAttribute: null
  defaults: ->
    pairIds: []
  constructor: (args...) ->
    super args...
    @logMessages = new LogMessages

  addPair: (stream, node) ->
    pairIds = @get 'pairIds'
    pid = @_pid stream, node
    pairIds.push pid if pid not in pairIds
    stream.trigger 'lwatch', node, @
    node.trigger 'lwatch', stream, @
    stream.screens.update @
    node.screens.update @
    @collection.trigger 'addPair'

  removePair: (stream, node) ->
    pairIds = @get 'pairIds'
    pid = @_pid stream, node
    @set 'pairIds', (p for p in pairIds when p isnt pid)
    stream.trigger 'lunwatch', node, @
    node.trigger 'lunwatch', stream, @
    stream.screens.remove @
    node.screens.remove @
    @collection.trigger 'removePair'

  hasPair: (stream, node) ->
    pid = @_pid stream, node
    pid in @get 'pairIds'

  _pid: (stream, node) -> "#{stream.id}:#{node.id}"

  isActive: (object, getPair) ->
    # Returns true if all object pairs are activated on screen
    return false if not object.pairs.length
    object.pairs.every (item) =>
      [stream, node] = getPair object, item
      @hasPair stream, node

class LogScreens extends backbone.Collection
  model: LogScreen

###
WebClient listens for log messages and stream/node announcements
from the server via socket.io.  It manipulates state in LogNodes &
LogStreams collections, which triggers view events.

###

class WebClient
  constructor: (opts={host: '', secure: false}, @localStorage={}) ->
    @stats =
      nodes: 0
      streams: 0
      messages: 0
      start: new Date().getTime()
    @logNodes = new LogNodes
    @logStreams = new LogStreams
    @logScreens = new LogScreens
    @app = new ClientApplication
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
      webClient: @
    @app.render()
    @_initScreens()
    @socket = io.connect opts.host, secure: opts.secure
    _on = (args...) => @socket.on args...

    # Bind to socket events from server
    _on 'add_node', @_addNode
    _on 'add_stream', @_addStream
    _on 'remove_node', @_removeNode
    _on 'remove_stream', @_removeStream
    _on 'add_pair', @_addPair
    _on 'new_log', @_newLog
    _on 'ping', @_ping
    _on 'disconnect', @_disconnect

  _initScreens: =>
    @logScreens.on 'add remove addPair removePair', =>
      @localStorage['logScreens'] = JSON.stringify @logScreens.toJSON()
    screenCache = @localStorage['logScreens']
    screens = if screenCache then JSON.parse(screenCache) else [{name: 'Screen1'}]
    @logScreens.add new @logScreens.model screen for screen in screens

  _addNode: (node) =>
    @logNodes.add node
    @stats.nodes++

  _addStream: (stream) =>
    @logStreams.add stream
    @stats.streams++
    stream = @logStreams.get stream.name
    stream.on 'lwatch', (node, screen) =>
      @socket.emit 'watch', screen._pid stream, node
    stream.on 'lunwatch', (node, screen) =>
      @socket.emit 'unwatch', screen._pid stream, node

  _removeNode: (node) =>
    @logNodes.get(node.name)?.destroy()
    @stats.nodes--

  _removeStream: (stream) =>
    @logStreams.get(stream.name)?.destroy()
    @stats.streams--

  _addPair: (p) =>
    stream = @logStreams.get p.stream
    node = @logNodes.get p.node
    stream.pairs.add node
    node.pairs.add stream
    @logScreens.each (screen) ->
      screen.addPair stream, node if screen.hasPair stream, node

  _newLog: (msg) =>
    {stream, node, level, message} = msg
    stream = @logStreams.get stream
    node = @logNodes.get node
    @logScreens.each (screen) ->
      if screen.hasPair stream, node
        screen.trigger 'new_log', new LogMessage
          stream: stream
          node: node
          level: level
          message: message

  _ping: (msg) =>
    {stream, node} = msg
    stream = @logStreams.get stream
    node = @logNodes.get node
    stream.trigger 'ping', node if stream
    node.trigger 'ping', stream if node
    @stats.messages++

  _disconnect: =>
    @logNodes.reset()
    @logStreams.reset()
    @stats.nodes = 0
    @stats.streams = 0

  createScreen: (sname) ->
    screen = new LogScreen name: sname
    @logScreens.add screen
    screen

###
Backbone views are used to manage the UI components,
including the list of log nodes and screen panels.

# View heirarchy:
ClientApplication
  LogControlPanel
    ObjectControls
      ObjectGroupControls
        ObjectItemControls
  LogScreenPanel
    LogScreenView
    LogStatsView

TODO(msmathers): Build templates, fill out render() methods

###

class ClientApplication extends backbone.View
  el: '#web_client'
  template: _.template templates.clientApplication
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens, @webClient} = opts
    @controls = new LogControlPanel
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
    @screens = new LogScreensPanel
      logScreens: @logScreens
      webClient: @webClient
    $(window).resize @_resize if window?
    @listenTo @logScreens, 'add remove', @_resize

  _resize: =>
    return if not window?
    width = $(window).width() - @$el.find("#log_controls").width()
    @$el.find("#log_screens").width width

  render: ->
    @$el.html @template()
    @$el.append @controls.render().el
    @$el.append @screens.render().el
    @_resize()
    @

class LogControlPanel extends backbone.View
  id: 'log_controls'
  template: _.template templates.logControlPanel
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens} = opts
    @streams = new ObjectControls
      objects: @logStreams
      logScreens: @logScreens
      getPair: (object, item) -> [object, item]
      id: 'log_control_streams'
    @nodes = new ObjectControls
      objects: @logNodes
      logScreens: @logScreens
      getPair: (object, item) -> [item, object]
      id: 'log_control_nodes'
      attributes:
        style: 'display: none'

  events:
    "click a.select_mode": "_toggleMode"

  _toggleMode: (e) =>
    target = $ e.currentTarget
    target.addClass('active').siblings().removeClass 'active'
    tid = target.attr 'href'
    @$el.find(tid).show().siblings('.object_controls').hide()
    false

  render: ->
    @$el.html @template()
    @$el.append @streams.render().el
    @$el.append @nodes.render().el
    @

class ObjectControls extends backbone.View
  className: 'object_controls'
  template: _.template templates.objectControls
  initialize: (opts) ->
    {@objects, @getPair, @logScreens} = opts
    @listenTo @objects, 'add', @_addObject
    @listenTo @objects, 'reset', => @render()
    $(window).resize @_resize if window?
    @filter = null

  _addObject: (obj) =>
    @_insertObject new ObjectGroupControls
      object: obj
      getPair: @getPair
      logScreens: @logScreens

  _insertObject: (view) ->
    view._filter @filter if @filter
    view.render()
    index = @objects.indexOf view.object
    if index > 0
      view.$el.insertAfter @$el.find "div.groups div.group:eq(#{index - 1})"
    else
      @$el.find("div.groups").prepend view.el

  _filter: (e) =>
    input = $ e.currentTarget
    filter = input.val()
    @filter = if filter then new RegExp "(#{filter})", 'ig' else null
    @objects.trigger 'ui_filter', @filter

  _resize: =>
    return if not window?
    height = $(window).height()
    @$el.find(".groups").height height - 80;

  render: ->
    @$el.html @template
      title: @id
    @$el.find('.filter').keyup @_filter
    @_resize()
    @

class ObjectGroupControls extends backbone.View
  className: 'group'
  template: _.template templates.objectGroupControls
  initialize: (opts) ->
    {@object, @getPair, @logScreens} = opts
    @object.pairs.each @_addItem
    @listenTo @object.pairs, 'add', @_addItem
    @listenTo @object, 'destroy', => @remove()
    @listenTo @object.collection, 'ui_filter', @_filter
    @header_view = new ObjectGroupHeader
      object: @object
      getPair: @getPair
      logScreens: @logScreens
    @header_view.render()

  _filter: (filter) =>
    if filter and not @object.get('name').match filter
      @$el.hide()
    else
      @$el.show()

  _addItem: (pair) =>
    @_insertItem new ObjectItemControls
      item: pair
      getPair: @getPair
      object: @object
      logScreens: @logScreens

  _insertItem: (view) ->
    view.render()
    index = @object.pairs.indexOf view.item
    if index > 0
      view.$el.insertAfter @$el.find "div.items div.item:eq(#{index - 1})"
    else
      @$el.find("div.items").prepend view.el

  render: ->
    @$el.html @template
    @$el.prepend @header_view.el
    @

class ObjectGroupHeader extends backbone.View
  className: 'header'
  template: _.template templates.objectGroupHeader

  initialize: (opts) ->
    {@object, @getPair, @logScreens} = opts
    @listenTo @logScreens, 'add remove', => @render()
    @listenTo @object, 'destroy', => @remove()
    @listenTo @object, 'lwatch lunwatch', => @render()
    @listenTo @object.collection, 'add', => @render()
    @listenTo @object, 'ping', @_ping

  events:
    "click input": "_toggleScreen"

  _toggleScreen: (e) =>
    checkbox = $ e.currentTarget
    screen_id = checkbox.attr('title').replace /screen-/ig, ''
    screen = @logScreens.get screen_id
    @object.pairs.forEach (item) =>
      [stream, node] = @getPair @object, item
      if checkbox.is ':checked'
        screen.addPair stream, node
      else
        screen.removePair stream, node

  _ping: =>
    @diode.addClass 'ping'
    setTimeout (=> @diode.removeClass 'ping'), 20

  render: =>
    @$el.html @template
      getPair: @getPair
      object: @object
      logScreens: @logScreens
    @diode = @$el.find '.diode'
    @

class ObjectItemControls extends backbone.View
  className: 'item'
  template: _.template templates.objectItemControls
  initialize: (opts) ->
    {@item, @object, @logScreens} = opts
    [@stream, @node] = opts.getPair @object, @item
    @listenTo @logScreens, 'add remove', => @render()
    @listenTo @item, 'destroy', => @remove()
    @listenTo @stream, 'lwatch lunwatch', => @render()
    @listenTo @item, 'ping', @_ping

  events:
    "click input": "_toggleScreen"

  _toggleScreen: (e) =>
    checkbox = $ e.currentTarget
    screen_id = checkbox.attr('title').replace /screen-/ig, ''
    screen = @logScreens.get screen_id
    if checkbox.is ':checked'
      screen.addPair @stream, @node
    else
      screen.removePair @stream, @node

  _ping: (object) =>
    if object is @object
      @diode.addClass 'ping'
      setTimeout (=> @diode.removeClass 'ping'), 20

  render: ->
    @$el.html @template
      item: @item
      stream: @stream
      node: @node
      logScreens: @logScreens
    @diode = @$el.find '.diode'
    @

class LogScreensPanel extends backbone.View
  template: _.template templates.logScreensPanel
  id: 'log_screens'
  initialize: (opts) ->
    {@logScreens, @webClient} = opts
    @listenTo @logScreens, 'add', @_addLogScreen
    @listenTo @logScreens, 'add remove', @_resize
    $(window).resize @_resize if window?
    @statsView = new LogStatsView stats: @webClient.stats

  events:
    "click #new_screen_button": "_newScreen"

  _newScreen: (e) ->
    @logScreens.add new @logScreens.model name: 'Screen1'
    false

  _addLogScreen: (screen) =>
    view = new LogScreenView
      logScreens: @logScreens
      logScreen: screen
    @$el.find("div.log_screens").append view.render().el
    false

  _resize: =>
    return if not window?
    lscreens = @logScreens
    if lscreens.length
      height = $(window).height() - @$el.find("div.status_bar").height() - 10
      @$el.find(".log_screen .messages").each ->
        $(@).height (height/lscreens.length) - 12

  render: ->
    @$el.html @template()
    @$el.find('.stats').append @statsView.render().el
    @_resize()
    @

class LogScreenView extends backbone.View
  className: 'log_screen'
  template: _.template templates.logScreenView
  logTemplate: _.template templates.logMessage
  initialize: (opts) ->
    {@logScreen, @logScreens} = opts
    @listenTo @logScreen, 'destroy', => @remove()
    @listenTo @logScreen, 'new_log', @_addNewLogMessage
    @forceScroll = true
    @filter = null

  events:
    "click .controls .close": "_close"
    "click .controls .clear": "_clear"

  _close: =>
    @logScreen.logMessages.reset()
    @logScreen.destroy()
    false

  _clear: =>
    @logScreen.logMessages.reset()
    @_renderMessages()
    false

  __filter: (e) =>
    input = $ e.currentTarget
    _filter_buffer = input.val()
    wait = =>
      @_filter _filter_buffer if _filter_buffer is input.val()
    setTimeout wait, 350

  _filter: (filter) =>
    @filter = if filter then new RegExp "(#{filter})", 'ig' else null
    @_renderMessages()

  _addNewLogMessage: (lmessage) =>
    @logScreen.logMessages.add lmessage
    @_renderNewLog lmessage

  _recordScroll: (e) =>
    msgs = @$el.find '.messages'
    @forceScroll = (parseInt(msgs.height(),10) + msgs[0].scrollTop) is msgs[0].scrollHeight

  _renderNewLog: (lmessage) =>
    _msg = lmessage.get 'message'
    msg = lmessage.render_message()
    if @filter
      msg = if _msg.match @filter then msg.replace @filter, '<span class="highlight">$1</span>' else null
    if msg
      @msgs.append @logTemplate
        lmessage: lmessage
        msg: msg
      @$el.find('.messages')[0].scrollTop = @$el.find('.messages')[0].scrollHeight if @forceScroll

  _renderMessages: =>
    @msgs.html ''
    @logScreen.logMessages.forEach @_renderNewLog

  render: ->
    @$el.html @template
      logScreens: @logScreens
    @$el.find('.messages').scroll @_recordScroll
    @$el.find('.controls .filter input').keyup @__filter
    @msgs = @$el.find '.msg'
    @_renderMessages()
    @

class LogStatsView extends backbone.View
  template: _.template templates.logStatsView
  className: 'stats'
  initialize: (opts) ->
    {@stats} = opts
    @rendered = false
    setInterval (=> @render() if @rendered), 1000

  render: ->
    @$el.html @template
      stats: @stats
    @rendered = true
    @

exports.WebClient = WebClient

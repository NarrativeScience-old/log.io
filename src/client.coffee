### Log.io Web Client

Listens to server for new log messages, renders them to screen "widgets".

# Usage:
wclient = new WebClient io, host: 'http://localhost:28778'
screen = wclient.createScreen 'Screen 1'
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

class _LogObjects extends backbone.Collection
  model: _LogObject

class LogStream extends _LogObject
  _type: 'logStream'
  _pclass: -> new LogNodes

class LogStreams extends _LogObjects
  model: LogStream

class LogNode extends _LogObject
  _type: 'logNode'
  _pclass: -> new LogStreams

class LogNodes extends _LogObjects
  model: LogNode

###
LogScreen models maintain state for screen widgets in the UI.
When (Stream, Node) pairs are associated with a screen, the pair ID
is stored on the model.  It uses pair ID instead of models themselves
in case a node goes offline, and a new LogNode model is created.

###
class LogScreen extends backbone.Model
  constructor: (args...) ->
    super args...
    @pairIds = []

  addPair: (stream, node) ->
    pid = @_pid stream, node
    @pairIds.push pid if pid not in @pairIds
    # Tell server to relay stream to client if this is hte first screen
    stream.trigger 'watch', pid if stream.screens.length is 0
    stream.screens.update @
    node.screens.update @

  removePair: (stream, node) ->
    pid = @_pid stream, node
    @pairIds = (p for p in @pairIds when p isnt pid)
    # Tell server to stop relaying stream if no other screens are connected
    stream.trigger 'unwatch', pid if stream.screens.length is 1
    stream.screens.remove @
    node.screens.remove @

  hasPair: (stream, node) ->
    pid = @_pid stream, node
    pid in @pairIds

  _pid: (stream, node) -> "#{stream.id}:#{node.id}"

class LogScreens extends backbone.Collection
  model: LogScreen

###
WebClient listens for log messages and stream/node announcements
from the server via socket.io.  It manipulates state in LogNodes &
LogStreams collections, which triggers view events.

###

class WebClient
  constructor: ->
    @logNodes = new LogNodes
    @logStreams = new LogStreams
    @logScreens = new LogScreens
    @app = new ClientApplication
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
    @app.render()
    @socket = io.connect()
    _on = (args...) => @socket.on args...

    # Bind to socket events from server
    _on 'add_node', @_addNode
    _on 'add_stream', @_addStream
    _on 'remove_node', @_removeNode
    _on 'remove_stream', @_removeStream
    _on 'add_pair', @_addPair
    _on 'new_log', @_newLog
    _on 'disconnect', =>
      @logNodes.each (node) -> node.destroy()
      @logStreams.each (stream) -> stream.destroy()

  _addNode: (node) =>
    @logNodes.update node

  _addStream: (stream) =>
    @logStreams.update stream
    stream = @logStreams.get stream.name
    stream.on 'watch', (pid) => @socket.emit 'watch', pid
    stream.on 'unwatch', (pid) => @socket.emit 'unwatch', pid

  _removeNode: (node) =>
    @logNodes.get(node.name)?.destroy()

  _removeStream: (stream) =>
    @logStreams.get(stream.name)?.destroy()

  _addPair: (p) =>
    stream = @logStreams.get p.stream
    node = @logNodes.get p.node
    stream.pairs.update node
    node.pairs.update stream
    @logScreens.each (screen) ->
      screen.addPair stream, node if screen.hasPair stream, node

  _newLog: (msg) =>
    {stream, node, level, message} = msg
    stream = @logStreams.get stream
    node = @logNodes.get node
    @logScreens.each (screen) ->
      if screen.hasPair stream, node
        screen.trigger 'new_log', stream, node, level, message

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

TODO(msmathers): Build templates, fill out render() methods

###

class ClientApplication extends backbone.View
  el: 'body'
  id: 'web_client'
  template: _.template templates.clientApplication
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens} = opts
    @controls = new LogControlPanel
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
    @screens = new LogScreensPanel
      logScreens: @logScreens

  render: ->
    @$el.html @template()
    @$el.append @controls.render().el
    @$el.append @screens.render().el
    @

class LogControlPanel extends backbone.View
  id: 'log_controls'
  template: _.template templates.logControlPanel
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens} = opts
    @streams = new ObjectControls
      objects: @logStreams
      logScreens: @logScreens
      id: 'log_control_streams'
    @nodes = new ObjectControls
      objects: @logNodes
      logScreens: @logScreens
      id: 'log_control_node'

  render: ->
    @$el.html @template()
    @$el.append @streams.render().el
    @$el.append @nodes.render().el
    @
    
class ObjectControls extends backbone.View
  className: 'object_controls'
  template: _.template templates.objectControls
  initialize: (opts) ->
    {@objects, @logScreens} = opts
    @listenTo @objects, 'add', @_addObject

  _addObject: (obj) =>
    @_insertObject new ObjectGroupControls
      object: obj
      logScreens: @logScreens

  _insertObject: (view) ->
    view.render()
    index = @objects.indexOf view.object
    if index > 0
      view.el.insertAfter @$el.find "div.groups div.group:eq(#{index - 1})"
    else
      @$el.find("div.groups").prepend view.el

  render: ->
    @$el.html @template
      title: @id
    @

class ObjectGroupControls extends backbone.View
  className: 'group'
  template: _.template templates.objectGroupControls
  initialize: (opts) ->
    {@object, @logScreens} = opts
    @object.pairs.each @_addItem
    @listenTo @object.pairs, 'add', @_addItem
    @listenTo @object, 'destroy', => @remove()

  _addItem: (pair) =>
    @_insertItem new ObjectItemControls
      item: pair
      object: @object
      logScreens: @logScreens

  _insertItem: (view) ->
    view.render()
    index = @object.pairs.indexOf view.item
    if index > 0
      view.el.insertAfter @$el.find "div.items div.item:eq(#{index - 1})"
    else
      @$el.find("div.items").prepend view.el

  render: ->
    @$el.html @template
      object: @object
      logScreens: @logScreens
    @

class ObjectItemControls extends backbone.View
  className: 'item'
  template: _.template templates.objectItemControls
  initialize: (opts) ->
    {@item, @object, @logScreens} = opts
    @listenTo @logScreens, 'add', => @render()
    @listenTo @item, 'destroy', => @remove()

  events:
    "click input": "_toggleScreen"

  _toggleScreen: (e) =>
    checkbox = $ e.currentTarget
    screen_id = checkbox.attr('title').replace /screen-/ig, ''
    screen = @logScreens.get screen_id
    [stream, node] = if @item_type is 'logStream' then [@item, @object] else [@object, @item]
    if checkbox.is ':checked'
      screen.addPair stream, node
    else
      screen.removePair stream, node

  render: ->
    @$el.html @template
      item: @item
      logScreens: @logScreens
    @

class LogScreensPanel extends backbone.View
  template: _.template templates.logScreensPanel
  id: 'log_screens'
  initialize: (opts) ->
    {@logScreens} = opts
    @listenTo @logScreens, 'add', @_addLogScreen

  events:
    "click #new_screen_button": "_newButton"

  _newButton: (e) ->
    @logScreens.add new @logScreens.model name: 'Screen1'
    false

  _addLogScreen: (screen) =>
    screen = new LogScreenView
      logScreen: screen
    @$el.find("div.log_screens").append screen.render().el

  render: ->
    @$el.html @template()
    @

class LogScreenView extends backbone.View
  className: 'log_screen'
  template: _.template templates.logScreenView
  log_template: _.template templates.logMessage
  initialize: (opts) ->
    {@logScreen} = opts 
    @listenTo @logScreen, 'destroy', => @remove()
    @listenTo @logScreen, 'new_log', @_renderNewLog

  _renderNewLog: (stream, node, level, message) =>
    @$el.append "#{stream.id}|#{node.id}|#{message}"

  render: ->
    @$el.html @template()
    @

exports.WebClient = WebClient

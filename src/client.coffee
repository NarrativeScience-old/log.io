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

backbone = require 'backbone'
$ = backbone.$ = require 'jquery'
io = require 'socket.io-client'

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
  _pclass: -> new LogNodes

class LogStreams extends _LogObjects
  model: LogStream

class LogNode extends _LogObject
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
  constructor: (@io, config) ->
    {@host} = config
    @logNodes = new LogNodes
    @logStreams = new LogStreams
    @logScreens = new LogScreens
    @app = new ClientApplication
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
    @app.render()
    @socket = @io.connect @host
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
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens} = opts
    @controls = new LogControlPanel
      logNodes: @logNodes
      logStreams: @logStreams
      logScreens: @logScreens
    @screens = new LogScreensPanel
      logScreens: @logScreens

  render: ->
    @$el.append @controls.render().el
    @$el.append @screens.render().el
    @

class LogControlPanel extends backbone.View
  id: 'log_control_panel'
  initialize: (opts) ->
    {@logNodes, @logStreams, @logScreens} = opts
    @streams = new ObjectControls
      objects: @logStreams
      id: 'log_control_streams'
    @nodes = new ObjectControls
      objects: @logNodes
      id: 'log_control_node'

  render: ->
    @$el.append @streams.render().el
    @$el.append @nodes.render().el
    @
    
class ObjectControls extends backbone.View
  className: 'object'
  initialize: (opts) ->
    {@objects} = opts
    @listenTo @objects, 'add', @_addObject

  _addObject: (obj) =>
    @_insertObject new ObjectGroupControls
      object: obj
      logScreens: @logScreens

  _insertObject: (view) ->
    view.render()
    index = @objects.indexOf view.object
    if index > 0
      view.el.insertAfter @$el.find "div.group:eq(#{index - 1})"
    else
      @$el.prepend view.el

  render: -> @

class ObjectGroupControls extends backbone.View
  className: 'group'
  initialize: (opts) ->
    {@object, @logScreens} = opts
    @object.pairs.each @_addItem
    @listenTo @object.pairs, 'add', @_addItem
    @listenTo @object, 'destroy', => @remove()

  _addItem: (pair) =>
    @_insertItem new ObjectItemControls
      item: pair
      logScreens: @logScreens

  _insertItem: (view) ->
    view.render()
    index = @object.pairs.indexOf view.item
    if index > 0
      view.el.insertAfter @$el.find "div.item:eq(#{index - 1})"
    else
      @$el.find("div.objects").prepend view.el

  render: -> @

class ObjectItemControls extends backbone.View
  className: 'item'
  initialize: (opts) ->
    {@item, @logScreens} = opts
    @listenTo @item, 'destroy', => @remove()

  render: -> @

class LogScreensPanel extends backbone.View
  id: 'log_screen_panel'
  initialize: (opts) ->
    {@logScreens} = opts
    @listenTo @logScreens, 'add', @_addLogScreen

  _addLogScreen: (screen) =>
    screen = new LogScreenView
      logScreen: screen
    @$el.append screen.render().el

  render: -> @

class LogScreenView extends backbone.View
  className: 'log_screen'
  initialize: (opts) ->
    {@logScreen} = opts 
    @listenTo @logScreen, 'destroy', => @remove()
    @listenTo @logScreen, 'new_log', @_renderNewLog

  _renderNewLog: (stream, node, level, message) =>
    @$el.append "#{stream.id}|#{node.id}|#{message}"

  render: -> @

exports.WebClient = WebClient
exports.$ = $

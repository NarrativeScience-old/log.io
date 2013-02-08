### Log.io Web Client

Listens to server for new log messages, renders them to screen "widgets".

# Usage:
wclient = new WebClient io, host: 'http://localhost:28778'
screen = wclient.createScreen 'Screen 1'
stream = wclient.logNodes.at(0).streams.at 0
screen.addStream(stream)
screen.on 'send_log', (message, lstream) ->
 
###

backbone = require 'backbone'
$ = backbone.$ = require 'jquery'
io = require 'socket.io-client'

### 
Backbone models are used to represent harvester nodes and their log streams.
When nodes go offline, their LogNode model and child LogStream models
are destroyed.

###

class LogStream extends backbone.Model
  constructor: (args...) ->
    super args...
    @screens = new LogScreens

class LogStreams extends backbone.Collection
  model: LogStream

class LogNode extends backbone.Model
  idAttribute: 'name'
  constructor: (attrs, args...) ->
    super attrs, args...
    @streams = new LogStreams (stream for l, stream of attrs.logStreams)

class LogNodes extends backbone.Collection
  model: LogNode

###
LogScreen models maintain state for screen widgets in the UI.
When streams are associated with a screen, the stream's ID is stored 
on the LogScreen model. It uses its ID instead of the model itself in case
the stream's node goes offline, and a new LogStream model is created.

###
class LogScreen extends backbone.Model
  constructor: (args...) ->
    super args...
    @streamIds = []

  addStream: (lstream) ->
    # Store stream_id on model
    @streamIds.push lstream.id unless lstream.id in @streamIds
    # Tell server to relay stream to client if this is the first screen
    lstream.trigger 'watch' if lstream.screens.length is 0
    lstream.screens.update @

  removeStream: (lstream) ->
    # Remove stream_id from model
    @streamIds = (sid for sid in streamIds when sid isnt lstream.id)
    # Tell server to stop relaying stream if no other screens are connected
    lstream.trigger 'unwatch' if lstream.screens.length is 1
    lstream.screens.remove @

class LogScreens extends backbone.Collection
  model: LogScreen

###
WebClient listens for log messages from the server via socket.io.
It uses a LogNodes collection to store all node & stream state,
which gets modified by socket inbound events.  It uses a LogScreens
collection to store all screen widget information.

###

class WebClient
  constructor: (@io, config) ->
    {@host} = config
    @logNodes = new LogNodes
    @logScreens = new LogScreens
    @app = new ClientApplication
      logNodes: @logNodes
      logScreens: @logScreens
    @app.render()
    @socket = @io.connect @host

    # Bind to socket events from server
    @socket.on 'announce_log_node', (lnode) =>
      @logNodes.update lnode
    @socket.on 'remove_log_node', (lnode) =>
      @logNodes.get(lnode.id)?.destroy()
    @socket.on 'disconnect', (e) =>
      @logNodes.reset()
    @socket.on 'send_log', (e) =>
      {logStream, message} = e
      lstream = @logNodes.get(logStream.nodeName).streams.get logStream.id
      lstream.screens.each (screen) ->
        screen.trigger 'send_log', message, lstream
    
    @logNodes.on 'add', (lnode, collection) => @_bindNewLogNode lnode, collection

  _bindNewLogNode: (lnode, collection) =>
    # Bind model events to new client socket
    lnode.streams.each (lstream) =>
      lstream.on 'watch', =>
        @socket.emit 'watch', lstream
      lstream.on 'unwatch', =>
        @socket.emit 'unwatch', lstream
      # Are any screens already bound to this stream?
      @logScreens.each (lscreen) ->
        lscreen.addStream lstream for sid in lscreen.stream_ids when sid is lstream.id

  createScreen: (sname) ->
    screen = new LogScreen name: sname
    @logScreens.add screen
    screen

###
Backbone views are used to manage the UI components,
including the list of log nodes and screen panels.

# View heirarchy:
ClientApplication
  LogControls
    LogNodeControls
      LogStreamControls
  LogScreensView
    LogScreenView

TODO(msmathers): Build templates, fill out render() methods

###

class ClientApplication extends backbone.View
  el: 'body'
  id: 'web_client'
  initialize: (opts) ->
    {@logNodes, @logScreens} = opts
    @controls = new LogControls
      logNodes: @logNodes
      logScreens: @logScreens
    @screens = new LogScreensView
      logScreens: @logScreens

  render: ->
    @$el.append @controls.render().el
    @$el.append @screens.render().el
    @

class LogControls extends backbone.View
  id: 'log_controls'
  initialize: (opts) ->
    {@logNodes, @logScreens} = opts
    @listenTo @logNodes, 'add', @_addLogNodes

  _addLogNode: (lnode) =>
    @_insertLogNode new LogNodeControls
      logNode: lnode
      logScreens: @logScreens

  _insertLogNode: (lview) ->
    index = @logNodes.indexOf lview.logNode
    if index > 0
      lview.el.insertAfter @$el.find "div.log_node:eq(#{index - 1})"
    else 
      @$el.prepend lview.el

  render: -> @

class LogNodeControls extends backbone.View
  className: 'log_node'
  initialize: (opts) ->
    {@logNode, @logScreens} = opts
    @logNode.streams.each @_addLogStream
    @listenTo @logNode, 'destroy', @remove

  _addLogStream: (lstream) =>
    stream_view = new LogStreamControls
      logStream: lstream
      logNode: @logNode
      logScreens: @logScreens
    @$el.append stream_view.render().el

  render: -> @

class LogStreamControls extends backbone.View
  className: 'log_stream'
  initialize: (opts) ->
    {@logNode, @logStream, @logScreens} = opts
    @listenTo @logNode, 'destroy', @remove

  render: -> @

class LogScreensView extends backbone.View
  id: 'log_screens'
  initialize: (opts) ->
    {@logScreens} = opts
    @listenTo @logScreens, 'add', @_addLogScreen

  _addLogScreen: (lscreen) =>
    screen = new LogScreenView
      logScreen: lscreen
    @$el.append screen.render().el

  render: -> @

class LogScreenView extends backbone.View
  className: 'log_screen'
  initialize: (opts) ->
    {@logScreen} = opts 
    @listenTo @logScreen, 'destroy', @remove
    @listenTo @logScreen, 'send_log', @_renderNewLog

  _renderNewLog: (message, lstream) =>
    # Render log line template, append to @$el

  render: -> @

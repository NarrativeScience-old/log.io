### Log.io Web Client

Listens to server for new log messages, renders them to screen "widgets".

# Usage:
wclient = new WebClient io, host: 'http://localhost:28778'
screen = wclient.createStream 'Screen 1'
stream = wclient.logNodes.at(0).streams.at 0
screen.addStream(stream)
screen.on 'send_log', (message, lstream) ->
 
###

backbone = require 'backbone'
io = require 'socket.io-client'

### 
Backbone models are used to represent harvester nodes and their log streams.
When nodes go offline, their LogNode model and child LogStream models
are destroyed.

###

class LogStream extends backbone.Model
  constructor: (args...) ->
    super(args...)
    @screens = new LogScreens

class LogStreams extends backbone.Collection
  model: LogStream

class LogNode extends backbone.Model
  idAttribute: 'name'
  constructor: (attrs, args...) ->
    super(attrs, args...)
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
    super(args...)
    @streamIds = []

  addStream: (lstream) ->
    # Store stream_id on model
    @streamIds.push lstream.id if lstream.id not in @streamIds
    # Tell server to relay stream to client if this is the first screen
    lstream.trigger 'watch' if lstream.screens.length is 0
    lstream.screens.update @
    @on 'destroy', (screen) =>
      lstream.screens.remove @

  removeStream: (lstream) ->
    # Remove stream_id from model
    @streamIds = (sid for sid in streamIds when sid is not lstream.id)
    screens = lstream.get 'screens'
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
    @socket = @io.connect @host

    # Bind to socket events from server
    @socket.on 'announce_log_node', (lnode) =>
      @logNodes.update lnode
    @socket.on 'remove_log_node', (lnode) =>
      @logNodes.remove lnode
    @socket.on 'disconnect', (e) =>
      @logNodes.reset()
    @socket.on 'send_log', (e) =>
      {logStream, message} = e
      lstream = @logNodes.get(logStream.nodeName).streams.get logStream.id
      lstream.screens.each (screen) ->
        screen.trigger 'send_log', message, lstream

    # Bind model events to new client socket
    @logNodes.on 'add', (lnode, collection) =>
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

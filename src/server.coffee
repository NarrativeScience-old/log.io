### Log.io Log Server

Relays inbound log messages to web clients.

LogServer receives log messages via TCP:
"announce|my_node_name|stream1,stream2,stream3\r\n"
"log|stream1|this is a log message in stream1 dude\r\n"
"log|stream2|this is a log message in stream 2 dude\r\n"

WebServer listens for events emitted by LogServer and
forwards them to web clients via socket.io

# Usage:
logServer = new LogServer port: 28777
webServer = new WebServer logServer, port: 28778
webServer.run()

###

net = require 'net'
io = require 'socket.io'
events = require 'events'
winston = require 'winston'

class LogNode
  constructor: (@name, @streamNames) ->
    @logStreams = {}
    for sname in @streamNames
      @logStreams[sname] = new LogStream @name, sname

class LogStream
  constructor: (@nodeName, @label) ->
    @id = "#{@nodeName}:#{@label}"

###
LogServer listens for TCP connections from log harvesters.
Once a log harvester has announced itself, LogServer receives
log messages via TCP and emits 'receive_log' events.

###
class LogServer extends events.EventEmitter
  constructor: (config={}) ->
    {@port} = config
    @_log = config.logging ? winston
    @_delimiter = config.delimiter ? '\r\n'
    @logNodes = {}

  run: ->
    # Create TCP listener socket
    @listener = net.createServer (socket) =>
      socket.on 'data', (data) =>
        msgs = data.toString().split @_delimiter
        @_handle socket, msg for msg in msgs when msg
      socket.on 'error', (e) =>
        @_log.error 'Lost TCP connection...'
        @_removeLogNode socket.logNode if socket.logNode
        # Poll socket periodically to ensure health
      setInterval (-> socket.write 'ping'), 2000
    @listener.listen @port

  _handle: (socket, msg) ->
    @_log.debug "Handling message: #{msg}"
    [mtype, args...] = msg.split '|'
    switch mtype
      when 'announce' then @_announceLogNode socket, args...
      when 'log' then @_receiveLog socket, args...
      else @_log.error "Invalid TCP message: #{msg}"

  _removeLogNode: (logNode) ->
    @_log.info "Removing #{logNode.name}"
    @emit 'remove_log_node', logNode
    delete @logNodes[logNode.name]

  _announceLogNode: (socket, nodeName, streamNames) ->
    @_log.info "Announcing #{nodeName}:#{streamNames}"
    logNode = new LogNode nodeName, streamNames.split ','
    @logNodes[nodeName] = socket.logNode = logNode
    @emit 'announce_log_node', logNode

  _receiveLog: (socket, streamName, message) ->
    logStream = socket.logNode?.logStreams[streamName]
    if logStream
      @_log.debug "Received log: (#{logStream.nodeName}:#{logStream.label}) #{message}"
      @emit 'receive_log', logStream, message

###
WebServer relays LogServer events to web clients via socket.io.

###

class WebServer
  constructor: (@logServer, config) ->
    {@port} = config
    {@logNodes} = @logServer
    @_log = config.logging ? winston

  run: ->
    @_log.info 'Starting Log.io Web Server...'
    @logServer.run()
    @listener = io.listen(@port).sockets

    # Bind LogServer events to all web client sockets
    @logServer.on 'announce_log_node', (logNode) =>
      @listener.emit 'announce_log_node', logNode
    @logServer.on 'receive_log', (logStream, message) =>
      @listener.emit 'ping', logStream.id
      # Only send message to web clients watching logStream
      @listener.in(logStream.id).emit 'send_log',
        logStream: logStream
        message: message

    # Bind web client events to new web client socket
    @listener.on 'connection', (wclient) =>
      wclient.emit 'announce_log_node', lnode for label, lnode of @logNodes
      wclient.on 'watch', (lstream) ->
        wclient.join lstream.id
      wclient.on 'unwatch', (lstream) ->
        wclient.leave lstream.id
    @_log.info 'Server started, listening...'

exports.LogServer = LogServer
exports.WebServer = WebServer

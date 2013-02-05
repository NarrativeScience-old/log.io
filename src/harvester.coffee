### Log.io Log Harvester

Watches local files and sends new log message to server via TCP.

# Sample configuration:
config =
  nodeName: 'my_server01'
  logStreams:
    web_server: [
      '/var/log/nginx/access.log',
      '/var/log/nginx/error.log'
    ],
  server:
    host: '0.0.0.0',
    port: 28777

# Usage:
harvester = new LogHarvester config
harvester.run()

###

fs = require 'fs'
net = require 'net'
events = require 'events'
winston = require 'winston'

###
LogStream is a group of local files paths.  It watches each file for
changes, extracts new log messages, and emits 'send_log' events.

###
class LogStream extends events.EventEmitter
  constructor: (@name, @paths, @_log) ->

  watch: ->
    @_log.info "Starting log stream: '#{@name}'"
    @_watchFile path for path in @paths
    @

  _watchFile: (path) ->
      @_log.info "Watching file: '#{path}'"
      currSize = fs.statSync(path).size
      fs.watch path, (event, filename) =>
        if event is 'change'
          # Capture file offset information for change event
          fs.stat path, (err, stat) =>
            @_readNewLogs path, stat.size, currSize
            currSize = stat.size

  _readNewLogs: (path, curr, prev) ->
    # Use file offset information to stream new log lines from file
    rstream = fs.createReadStream path,
      encoding: 'utf8'
      start: prev
      end: curr
    # Emit 'send_log' event for every captured log line
    rstream.on 'data', (data) =>
      lines = data.split "\n"
      @emit 'send_log', line for line in lines when line

###
LogHarvester creates LogStreams based on provided configuration.

On startup, it opens a single TCP connection to the Log.io server
and announces its node name and stream names.

Sends new log messages to the server via string-delimited TCP messages.

###
class LogHarvester
  constructor: (config) ->
    {@nodeName, @server} = config
    @delim = config.delimiter ? '\r\n'
    @_log = config.logging ? winston
    @logStreams = (new LogStream s, paths, @_log for s, paths of config.logStreams)

  run: ->
    @_connect()
    for lstream in @logStreams
      lstream.watch().on 'send_log', (msg) =>
        @_sendLog lstream, msg if @_connected

  _connect: ->
    # Create TCP socket
    @socket = new net.Socket
    @socket.on 'error', (error) =>
      @_connected = false
      @_log.error "Unable to connect server, trying again..."
      setTimeout (=> @_connect()), 2000
    @_log.info "Connecting to server..."
    @socket.connect @server.port, @server.host, =>
      @_connected = true
      @_announce()

  _sendLog: (logStream, msg) ->
    @_log.debug "Sending log: (#{logStream.name}) #{msg}"
    @_send "log|#{logStream.name}|#{msg}"

  _announce: ->
    snames = (l.name for l in @logStreams).join ","
    @_log.info "Announcing: #{@nodeName} (#{snames})"
    @_send "announce|#{@nodeName}|#{snames}"

  _send: (msg) ->
    @socket.write "#{msg}#{@delim}"

exports.LogHarvester = LogHarvester
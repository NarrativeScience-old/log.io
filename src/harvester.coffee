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
    customLogs: [
      "/var/log/myCustomLogs/"
    ],
  server:
    host: '0.0.0.0',
    port: 28777

# Sends the following TCP messages to the server:
"+node|my_server01|web_server\r\n"
"+bind|node|my_server01\r\n"
"+log|web_server|my_server01|info|this is log messages\r\n"

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
changes, extracts new log messages, and emits 'new_log' events.

###
class LogStream extends events.EventEmitter
  constructor: (@name, @paths, @_log) ->

  watch: ->
    @_log.info "Starting log stream: '#{@name}'"
    @_watchFile path for path in @paths
    @

  _watchFolder: (path) ->
    filesUnderFolder = fs.readdirSync(path)
    for i of filesUnderFolder
      @_watchFile path + "/" + filesUnderFolder[i]

  _watchFile: (path) ->
      if not fs.existsSync path
        @_log.error "File doesn't exist: '#{path}'"
        setTimeout (=> @_watchFile path), 1000
        return
      if fs.lstatSync(path).isDirectory()
        @_watchFolder(path);
        return
      @_log.info "Watching file: '#{path}'"
      currSize = fs.statSync(path).size
      watcher = fs.watch path, (event, filename) =>
        if event is 'rename'
          # File has been rotated, start new watcher
          watcher.close()
          @_watchFile path
        if event is 'change'
          # Capture file offset information for change event
          fs.stat path, (err, stat) =>
            @_readNewLogs path, stat.size, currSize
            currSize = stat.size

  _readNewLogs: (path, curr, prev) ->
    # Use file offset information to stream new log lines from file
    return if curr < prev
    rstream = fs.createReadStream path,
      encoding: 'utf8'
      start: prev
      end: curr
    # Emit 'new_log' event for every captured log line
    rstream.on 'data', (data) =>
      lines = data.split "\n"
      @emit 'new_log', line for line in lines when line

###
LogHarvester creates LogStreams and opens a persistent TCP connection to the server.

On startup it announces itself as Node with Stream associations.
Log messages are sent to the server via string-delimited TCP messages

###
class LogHarvester
  constructor: (config) ->
    {@nodeName, @server} = config
    @delim = config.delimiter ? '\r\n'
    @_log = config.logging ? winston
    @logStreams = (new LogStream s, paths, @_log for s, paths of config.logStreams)

  run: ->
    @_connect()
    @logStreams.forEach (stream) =>
      stream.watch().on 'new_log', (msg) =>
        @_sendLog stream, msg if @_connected

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

  _sendLog: (stream, msg) ->
    @_log.debug "Sending log: (#{stream.name}) #{msg}"
    @_send '+log', stream.name, @nodeName, 'info', msg 

  _announce: ->
    snames = (l.name for l in @logStreams).join ","
    @_log.info "Announcing: #{@nodeName} (#{snames})"
    @_send '+node', @nodeName, snames
    @_send '+bind', 'node', @nodeName

  _send: (mtype, args...) ->
    @socket.write "#{mtype}|#{args.join '|'}#{@delim}"

exports.LogHarvester = LogHarvester
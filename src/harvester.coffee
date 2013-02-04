###
# Log.io Log Harvester
Watches local files defined by provided configuration,
sends new log messages to Log.io server via TCP.

# Sample configuration:
config =
  node_name: 'my_server01'
  log_streams:
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
winston = require 'winston'

###
LogStream watches multiple files on the local filesystem
and sends new log messages to the log harvester.

###
class LogStream
  constructor: (harvester, name, paths) ->
    @_harvester = harvester
    @_log = harvester._log
    @name = name
    @paths = paths

  watch: ->
    # Create file watchers for each file path in stream
    @_log.info "Starting log stream: '#{@name}'"
    for path in @paths
      @_log.info "Watching '#{path}'"
      curr_size = fs.statSync(path).size
      fs.watch path, (event, filename) =>
        if event is 'change'
          # Capture file offset information for change event
          fs.stat path, (err, stat) =>
            @_read_new_logs path, stat.size, curr_size
            curr_size = stat.size

  _read_new_logs: (path, curr, prev) ->
    # Use file offset information to stream new log lines from file
    rstream = fs.createReadStream path, {
      encoding: 'utf8'
      start: prev
      end: curr
    }
    rstream.on 'data', (data) =>
      lines = data.split "\n"
      # Always ignore last line, which is empty
      for line in lines when line
        @_send_log(line)

  _send_log: (msg) ->
    @_harvester.send_log(@, msg)


###
LogHarvester creates LogStreams based on provided configuration.

On startup, it opens a single TCP connection to the Log.io server
and announces its node name and stream names.

As watched files are written to, LogHarvester sends new log messages
to the server via string-delimited TCP messages.

###
class LogHarvester
  constructor: (config) ->
    @node_name = config.node_name
    @server = config.server
    @delim = config.delimiter ? '\r\n'
    @_log = config.logging ? winston
    @log_streams = (new LogStream @,s,paths for s,paths of config.log_streams)

  run: ->
    # Open TCP socket, announce harvester
    @_log.info "Connecting to server..."
    @socket = new net.Socket
    @socket.connect @server.port, @server.host, =>
      @_announce()
      # Tell streams to begin watching local files for changes
      for log_stream in @log_streams
        log_stream.watch()
      @_log.info("Harvester started, watching files...")

  send_log: (log_stream, msg) ->
    @_log.debug "Sending log: (#{log_stream.name}) #{msg}"
    @_send "log|#{log_stream.name}|#{msg}"

  _announce: ->
    stream_names = (l.name for l in @log_streams).join ","
    @_log.info "Announcing: #{@node_name} (#{stream_names})"
    @_send "announce|#{@node_name}|#{stream_names}"

  _send: (msg) ->
    @socket.write("#{msg}#{@delim}")

exports.LogHarvester = LogHarvester

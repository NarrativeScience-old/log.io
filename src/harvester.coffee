fs = require 'fs'
net = require 'net'
events = require 'events'
winston = require 'winston'

###*
# Mainly used by `LogHarvester`.
# 
#  - Watches log file for changes
#  - Extracts new log messages
#  - Then emits 'log_new' events.
# 
# @class LogStream
# @extends events.EventEmitter
###
class LogStream extends events.EventEmitter

	###*
	# Emits event for every new captured log line
	# @event log_new
	# @param {String} message Log line
	###

	###*
	# Started watching a file
	# @event file_watching
	# @param {String} path Target filename
	# @param {Boolean} watching If file watch was started successfully on not
	###

	###*
	# Initializing new `LogStream` instance
	# @constructor
	# @param {Object} name name of current log stream. Only used for debugging.
	# @param {Object} paths Array of local files paths. 
	# @param {Object} _log Winston (or compatible) logger object. Only used for debugging.
	###
	constructor: (@name, @paths, @_log) ->
		@watchers = {}
		@keep_retrying = true

	###*
	# Initialising all file watching
	# @method watch
	###
	watch: ->
		@_log.info "Starting log stream: '#{@name}'"
		@_watchFile path for path in @paths
		@

	###*
	# Stopping all file watching
	# @method unwatch
	###
	unwatch: ->
		@keep_retrying = false
		for path, watcher of @watchers
			@_log.info 'Unwatching file', path
			watcher.close()
		@

	###*
	# Watching all files under specified directory
	# @method watch
	# @param {String} path Path to directory
	###
	_watchDirectory: (path) ->
		for k, i of fs.readdirSync path
			@_watchFile path + "/" + i

	###*
	# Starting to watch file changes.
	# @method watch
	# @param {String} path Path to file or a directory
	###
	_watchFile: (path) ->
			# Checking if file exists
			if not fs.existsSync path
				@emit 'file_watching', path, false
				if @keep_retrying
					@_log.error "File doesn't exist: '#{path}'. Retrying in 1000ms."
					setTimeout (=> @_watchFile path), 1000
				return

			# Checking if path is a directory
			if fs.lstatSync(path).isDirectory()
				@_watchDirectory(path);
				return

			@_log.info "Watching file: '#{path}'"
			@emit 'file_watching', path, true
			currSize = fs.statSync(path).size

			if @watchers[path]
				@watchers[path].close()
				delete @watchers[path]

			watcher = fs.watch path, (event, filename) =>

				if event is 'rename'
					# File has been rotated, start new watcher
					@_watchFile path

				if event is 'change'
					# Capture file offset information for change event
					fs.exists path, (exists) =>
						if exists
							fs.stat path, (err, stat) =>
								@_readNewLogs path, stat.size, currSize
								currSize = stat.size
						else
							@_watchFile path

			@watchers[path] = watcher

	###*
	# File change has been detected. Determining what has been changed and emitting `log_new` event.
	# @method watch
	# @param {String} path Path to file or a directory
	###
	_readNewLogs: (path, curr, prev) ->
		# Use file offset information to stream new log lines from file
		return if curr < prev
		rstream = fs.createReadStream path,
			encoding: 'utf8'
			start: prev
			end: curr

		rstream.on 'data', (data) =>
			lines = data.split "\n"
			@emit 'log_new', line for line in lines when line

		rstream.on 'error', (data) =>

		rstream.on 'end', (data) =>

###*
# `LogHarvester` creates `LogStream` for each file watched and opens a persistent TCP connection to the server.
# 
# Watches local files and sends new log message to server via TCP.
# 
# On startup it announces itself as Node with Stream associations.
# 
# Log messages are sent to the server via string-delimited TCP messages.
# 
# Sample configuration:
# 
#     config =
#       nodeName: 'my_server01'
#       logStreams:
#         web_server: [
#           '/var/log/nginx/access.log',
#           '/var/log/nginx/error.log'
#         ],
#         customLogs: [
#           '/var/log/myCustomLogs/'
#         ],
#       server:
#         host: '0.0.0.0',
#         port: 28777
# 
# Configuration above sends the following TCP messages to the server:
# 
#     '+node|my_server01|web_server\r\n'
#     '+bind|node|my_server01\r\n'
#     '+log|web_server|my_server01|info|this is log messages\r\n'
# 
# Usage:
# 
#     harvester = new LogHarvester config
#     harvester.run()
#
# @class LogHarvester
# @extends events.EventEmitter
###
class LogHarvester extends events.EventEmitter

	###*
	# Fired when trying to connect to `LogServer`
	# @event connection
	# @param {Boolean} status Returns `true` if connection to server was successfull
	###
	EVT_CONNECTION: 'connection',

	###*
	# Maximum server connection retry time, in milliseconds
	# @property TIMEOUT_RECONNECT_MAX
	# @type Number
	# @default 60000
	###
	TIMEOUT_RECONNECT_MAX: 60000;

	###*
	# Starting server connection retry time, in milliseconds
	# @property TIMEOUT_RECONNECT_START
	# @type Number
	# @default 1000
	###
	TIMEOUT_RECONNECT_START: 1000;

	###*
	# Message buffer limitation
	# @property TIMEOUT_RECONNECT_START
	# @type Number
	# @default 64
	###
	LOG_BUFFER_LIMIT: 64;

	###*
	# Initializing new `LogHarvester` instance
	#
	# Default configuration:
	#
	#     config =
	#       nodeName: 'Untitled'
	#       delimiter: '\r\n'
	#       _log: winston
	#       logStreams: {}
	#       server:
	#         host: '0.0.0.0',
	#         port: 28777
	#
	# @constructor
	# @param {Object} config harvester configuration
	###
	constructor: (config = {}) ->
		@log_buffer = []
		config.nodeName = config.nodeName ? 'Untitled'
		config.delimiter = config.delimiter ? '\r\n'
		config._log = config._log ? winston
		config.logStreams = config.logStreams ? {}
		config.server = config.server ?
			host: '0.0.0.0'
			port: 28777
		@reconnect = null
		{@nodeName, @server, @delimiter, @_log} = config
		@logStreams = (new LogStream title, paths, @_log for title, paths of config.logStreams)
		@timeout_reconnect = @TIMEOUT_RECONNECT_START;
		@keep_retrying = true

	###*
	# Stops harvester and disconnects from server
	# @method stop
	###
	stop: ->
		@_disconnect()
		@_unwatchAll()

	###*
	# Run harvester and connect to server
	# @method run
	###
	run: ->
		@_connect()
		@_watchAll()

	###*
	# Creating TCP socket
	# @method _connect
	# @todo to detect server disconnect
	###
	_connect: ->
		@socket = new net.Socket

		@socket.on 'error', (error) =>
			@_connected = false
			@emit @EVT_CONNECTION, @f_connected
			@socket.destroy()
			if @keep_retrying
				@_log.error "Cannot connect to server, trying again in #{(@timeout_reconnect/1000)} second(s)..."
				@reconnect = setTimeout (=> @_connect()), @timeout_reconnect
				@timeout_reconnect = Math.min @timeout_reconnect * 2, @TIMEOUT_RECONNECT_MAX;

		@_log.info "Connecting to server #{@server.host}:#{@server.port}..."
		@socket.connect @server.port, @server.host, =>
			@_connected = true
			@_releaseBuffer()
			@emit @EVT_CONNECTION, @_connected
			@timeout_reconnect = @TIMEOUT_RECONNECT_START;
			@reconnect = null
			@_announce()

	###*
	# Stopping TCP socket
	# @method _disconnect
	###
	_disconnect: ->
		@keep_retrying = false
		@socket.destroy()
		if @reconnect
			clearTimeout @reconnect
			@reconnect = null
	
	###*
	# Start watching all files
	# @method _watchAll
	###
	_watchAll: ->
		@logStreams.forEach (stream) =>

			stream.on 'log_new', (msg) =>
				@emit 'log_new', stream, msg
				@_sendLog stream, msg if @_connected

			stream.on 'file_watching', (path, watching) =>
				@emit 'file_watching', path, watching

			stream.watch()
	
	###*
	# Stop watching all streams
	# @method _watchAll
	###
	_unwatchAll: ->
		@logStreams.forEach (stream) =>
			stream.unwatch()

	###*
	# Creating TCP socket
	# @method _sendLog
	# @param {Object} stream Stream that message is received from
	# @param {String} msg Log message body
	###
	_sendLog: (stream, msg) ->
		@_sendBufferred '+log', stream.name, @nodeName, 'info', msg 

	###*
	# Registed harvester to server
	# @method _announce
	###
	_announce: ->
		snames = (l.name for l in @logStreams).join ','
		@_log.info "Announcing: #{@nodeName} (#{snames})"
		@_send '+node', @nodeName, snames
		@_send '+bind', 'node', @nodeName

	###*
	# Encoding log message information to TCP string
	# @method _endcodeLog
	# @param {String} mtype Message type
	# @param {Object} args Array of message strings
	###
	_endcodeLog: (mtype, args...) ->
		"#{mtype}|#{args.join '|'}#{@delimiter}"

	###*
	# Writing message directly to socket
	# @method _send
	# @param {String} mtype Message type
	# @param {Object} args Array of message strings
	###
	_send: (mtype, args...) ->
		@_log.debug "Sending log: " + @_endcodeLog(mtype, args)
		@socket.write @_endcodeLog(mtype, args)
	
	###*
	# Writing message directly to socket if connected to server, otherwise saving to 'buffer'
	# @method _sendBufferred
	# @param {String} mtype Message type
	# @param {Object} args Array of message strings
	###
	_sendBufferred: (mtype, args...) ->
		if @_connected
			@socket.write @_endcodeLog(mtype, args)
		else
			if @log_buffer.length < @LOG_BUFFER_LIMIT
				@_log.debug "Saving log: " + @_endcodeLog(mtype, args)
				@log_buffer.push @_endcodeLog(mtype, args)
			else
				@_log.debug "Buffer limit reached. Log is lost: " + @_endcodeLog(mtype, args)
	
	###*
	# Writing message directly to socket if connected to server, otherwise saving to 'buffer'
	# @method _sendBufferred
	# @param {String} mtype Message type
	# @param {Object} args Array of message strings
	###
	_releaseBuffer: (mtype, args...) ->
		for message in @log_buffer
			@_log.debug "Sending saved log: (#{stream.name}) #{msg}"
			@socket.write message
		@log_buffer = []

exports.LogHarvester = LogHarvester
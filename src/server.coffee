fs = require 'fs'
net = require 'net'
http = require 'http'
https = require 'https'
io = require 'socket.io'
events = require 'events'
winston = require 'winston'
express = require 'express'

###*
# Base class for `LogNode` and `LogStream`
# 
# @class _LogObject
# @todo to fix server crash on one of harvesters disconnect
###
class _LogObject
	_type: 'object'
	_pclass: ->
	_pcollection: ->

	###*
	# Initializing new `_LogObject` instance
	# @constructor
	# @param {Object} logServer Instance of `LogServer`
	# @param {String} name Entity (`LogStream` or `LogNode`) name
	# @param {Object} _pairs Array of `LogNode` ans `LogStream` pairs
	###
	constructor: (@logServer, @name, _pairs=[]) ->
		@logServer.emit "add_#{@_type}", @
		@pairs = {}
		@pclass = @_pclass()
		@pcollection = @_pcollection()
		@addPair pname for pname in _pairs

	###*
	# A 'pair' refers to a `LogStream` to `LogNode` pair. 
	#
	# Method is called when you 'activate' a (stream, node) pair by clicking on a checkbox on the left, and tells the server to send any log messages that originated from that specific (stream, node) pair.
	#
	# @method addPair
	# @param {String} pname entity (`LogStream` or `LogNode`) name
	###
	addPair: (pname) ->
		if not pair = @pairs[pname]
			if not pair = @pcollection[pname]
				pair = @pcollection[pname] = new @pclass @logServer, pname
			pair.pairs[@name] = @
			@pairs[pname] = pair
			@logServer.emit "add_#{@_type}_pair", @, pname

	###*
	# Unregister instance from a server
	# @method remove
	# @param {String} pname entity (`LogStream` or `LogNode`) name
	###
	remove: ->
		@logServer.emit "remove_#{@_type}", @
		delete p.pairs[@name] for name, p of @pairs

	###*
	# Adds current object to known nodes or streams
	# @method toDict
	###
	toDict: ->
		name: @name
		pairs: (name for name, obj of @pairs)


###*
# Represents single log node
# 
# @class LogNode
# @extends _LogObject
###
class LogNode extends _LogObject
	_type: 'node'
	_pclass: -> LogStream
	_pcollection: -> @logServer.logStreams


###*
# Represents single log stream
# 
# @class LogStream
# @extends _LogObject
###
class LogStream extends _LogObject
	_type: 'stream'
	_pclass: -> LogNode
	_pcollection: -> @logServer.logNodes
	

###*
# `LogServer` listens for TCP connections. It parses & validates inbound TCP messages, and emits events.
#
# Relays inbound log messages to web clients
# 
# `LogServer` receives log messages via TCP:
#
#     "+log|my_stream|my_server_host|info|this is a log message\r\n"
# 
# Announce a node, optionally with stream associations
#
#     "+node|my_server_host\r\n"
#     "+node|my_server_host|my_stream1,my_stream2,my_stream3\r\n"
# 
# Announce a stream, optionally with node associations
#
#     "+stream|my_stream1\r\n"
#     "+stream|my_stream1|my_server_host1,my_host_server2\r\n"
# 
# Remove a node or stream
#
#     "-node|my_server_host1\r\n"
#     "-stream|stream2\r\n"
# 
# WebServer listens for events emitted by `LogServer` and forwards them to web clients via socket.io
# 
# Usage:
#
#     logServer = new LogServer port: 28777
#     webServer = new WebServer logServer, port: 28778
#     webServer.run()
#
# @class LogServer
# @extends events.EventEmitter
###
class LogServer extends events.EventEmitter
	
	###*
	# Initializing new `LogServer` instance
	# @constructor
	# @param {Object} [config={}] server properties
	###
	constructor: (config={}) ->
		{@host, @port} = config
		@_log = config.logging ? winston
		@_delimiter = config.delimiter ? '\r\n'
		@logNodes = {}
		@logStreams = {}

	###*
	# Run the server. Creates TCP listener socket and handle client disconnection
	# @method run
	###
	run: ->
		@listener = net.createServer (socket) =>
			socket._buffer = ''
			
			socket.on 'data', (data) =>
				@_receive data, socket
			
			socket.on 'error', (e) =>
				@_log.error "Client #{socket.node.name} has lost TCP connection."
				@_removeNode socket.node.name if socket.node
			
			socket.on 'close', (e) =>
				@_log.info "Client #{socket.node.name} has disconnected."
				@_removeNode socket.node.name if socket.node
		
		@listener.listen @port, @host

	###*
	# Receiving raw data from socket
	# @method _receive
	# @param {Object} data raw data that was received from a socket
	# @param {Object} socket source socket
	###
	_receive: (data, socket) =>
		part = data.toString()
		socket._buffer += part
		@_log.debug "Received TCP message: #{part}"
		@_flush socket if socket._buffer.indexOf @_delimiter >= 0

	###*
	# Parse socket buffer to separate messages
	# @method _flush
	# @param {Object} socket source socket
	###
	_flush: (socket) =>
		socket.pause()
		[msgs..., socket._buffer] = socket._buffer.split @_delimiter
		socket.resume()
		@_handle socket, msg for msg in msgs

	###*
	# Determining how to handle individual messages
	# @method _handle
	# @param {Object} socket source socket
	# @param {String} msg unparsed message string
	###
	_handle: (socket, msg) ->
		@_log.debug "Handling message: #{msg}"
		[mtype, args...] = msg.split '|'
		switch mtype
			when '+log' then @_newLog args...
			when '+node' then @_addNode args...
			when '-node' then @_removeNode args...
			when '+stream' then @_addStream args...
			when '-stream' then @_removeStream args...
			when '+bind' then @_bindNode socket, args...
			else @_log.error "Invalid TCP message: #{msg}"

	###*
	# Handling new log message
	# @method _newLog
	# @param {String} sname name of the stream that message was received from
	# @param {String} nname name of the node that message was received from
	# @param {String} logLevel level of log
	# @param {Object} [message=[]] parsed message string
	###
	_newLog: (sname, nname, logLevel, message...) ->
		message = message.join '|'
		@_log.debug "Log message: (#{sname}, #{nname}, #{logLevel}) #{message}"
		node = @logNodes[nname] or @_addNode nname, sname
		stream = @logStreams[sname] or @_addStream sname, nname
		@emit 'new_log', stream, node, logLevel, message

	###*
	# Handling add node message
	# @method _addNode
	# @param {String} nname name of node to add
	# @param {String} [snames='']
	###
	_addNode: (nname, snames='') ->
		@__add nname, snames, @logNodes, LogNode, 'node'

	###*
	# Handling remove node message
	# @method _removeNode
	# @param {String} nname name of node to remove
	###
	_removeNode: (nname) ->
		@__remove nname, @logNodes, 'node'
	
	###*
	# Handling add stream message
	# @method _addStream
	# @param {String} sname name of stream to add
	# @param {String} [nnames='']
	###
	_addStream: (sname, nnames='') ->
		@__add sname, nnames, @logStreams, LogStream, 'stream'

	###*
	# Handling remove stream message
	# @method _removeStream
	# @param {String} sname name of stream to remove
	###
	_removeStream: (sname) ->
		@__remove sname, @logStreams, 'stream'

	###*
	# Adding node or a stream
	# @method __add
	# @param {String} name name of node or stream that will be added
	# @param {String} pnames
	# @param {Object} _collection hash to add new object to. Could be `logNodes` or `logStreams`
	# @param {Object} _objClass class of object to create. Could be `logNode` or `logStream`.
	# @param {String} objType type of object as a string. Only used to console output.
	###
	__add: (name, pnames, _collection, _objClass, objType) ->
		@_log.info "Adding #{objType}: #{name} (#{pnames})"
		pnames = pnames.split ','
		obj = _collection[name] = _collection[name] or new _objClass @, name, pnames
		obj.addPair p for p in pnames when not obj.pairs[p]

	###*
	# Removing node or a stream
	# @method __add
	# @param {String} name name of node or stream that will be removed
	# @param {Object} _collection hash to remove new object from. Could be `logNodes` or `logStreams`
	# @param {String} objType type of object as a string. Only used to console output.
	###
	__remove: (name, _collection, objType) ->
		if obj = _collection[name]
			@_log.info "Removing #{objType}: #{name}"
			obj.remove()
			delete _collection[name]

	###*
	# Binding node to TCP socket
	# @method _bindNode
	# @param {Object} socket socket to bind node to
	# @param {Object} obj (not used)
	# @param {String} nname name of node. Only used to console output.
	###
	_bindNode: (socket, obj, nname) ->
		if node = @logNodes[nname]
			@_log.info "Binding node '#{nname}' to TCP socket"
			socket.node = node

###*
# WebServer relays `LogServer` events to web clients via socket.io.
# @class WebServer
###
class WebServer

	###*
	# Initializing new `WebServer` instance
	#
	# Default configuration:
	#
	#     config =
	#         restrictSocket: '*.*'
	#         logging: winston
	#         host: '0.0.0.0'
	#         port: 28778
	#         auth: null
	#
	# @constructor
	# @param {Object} logServer Instance of `LogServer`
	# @param {Object} config Configuration object
	###
	constructor: (@logServer, config) ->
		config.host = config.host ? '0.0.0.0'
		config.port = config.port ? 28778
		{@host, @port, @auth} = config
		{@logNodes, @logStreams} = @logServer
		@restrictSocket = config.restrictSocket ? '*:*'
		@_log = config.logging ? winston
		# Create express server
		app = @_buildServer config
		@http = @_createServer config, app

	###*
	# Setting up Express up, using config
	# @method _buildServer
	# @param {Object} config Congiguration object
	###
	_buildServer: (config) ->
		app = express()
		if @auth?
			app.use express.basicAuth @auth.user, @auth.pass
		if config.restrictHTTP
			ips = new RegExp config.restrictHTTP.join '|'
			app.all '/', (req, res, next) =>
				if not req.ip.match ips
					return res.send 403, "Your IP (#{req.ip}) is not allowed."
				next()
		staticPath = config.staticPath ? __dirname + '/../'
		app.use express.static staticPath

	###*
	# Setting up correct `server` object and assigning it to Express app
	# @method _createServer
	# @param {Object} config Congiguration object
	# @param {Object} app Congiguration object
	###
	_createServer: (config, app) ->
		if config.ssl
			return https.createServer {
				key: fs.readFileSync config.ssl.key
				cert: fs.readFileSync config.ssl.cert
			}, app
		else
			return http.createServer app

	###*
	# Starting up a server. Main entrance function.
	# @method run
	###
	run: ->
		@_log.info 'Starting Log.io Web Server...'
		@logServer.run()
		io = io.listen @http.listen @port, @host
		io.set 'log level', 1
		io.set 'origins', @restrictSocket
		@listener = io.sockets

		_on = (args...) => @logServer.on args...
		_emit = (_event, msg) =>
			@_log.debug "Relaying: #{_event}"
			@listener.emit _event, msg

		# Bind events from `LogServer` to web client
		_on 'add_node', (node) ->
			_emit 'add_node', node.toDict()
		_on 'add_stream', (stream) ->
			_emit 'add_stream', stream.toDict()
		_on 'add_stream_pair', (stream, nname) ->
			_emit 'add_pair', {stream: stream.name, node: nname}
		_on 'add_node_pair', (node, sname) ->
			_emit 'add_pair', {stream: sname, node: node.name}
		_on 'remove_node', (node) ->
			_emit 'remove_node', node.toDict()
		_on 'remove_stream', (stream) ->
			_emit 'remove_stream', stream.toDict()

		# Bind new log event from `LogServer` to web client
		_on 'new_log', (stream, node, level, message) =>
			_emit 'ping', {stream: stream.name, node: node.name}
			# Only send message to web clients watching logStream
			@listener.in("#{stream.name}:#{node.name}").emit 'new_log',
				stream: stream.name
				node: node.name
				level: level
				message: message

		# Bind web client connection, events to web server
		@listener.on 'connection', (wclient) =>
			wclient.emit 'add_node', node.toDict() for n, node of @logNodes
			wclient.emit 'add_stream', stream.toDict() for s, stream of @logStreams
			for n, node of @logNodes
				for s, stream of node.pairs
					wclient.emit 'add_pair', {stream: s, node: n}
			wclient.emit 'initialized'
			wclient.on 'watch', (pid) ->
				wclient.join pid
			wclient.on 'unwatch', (pid) ->
				wclient.leave pid
		@_log.info 'Server started, listening...'

exports.LogServer = LogServer
exports.WebServer = WebServer

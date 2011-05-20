/* Log Server
 * Listens for socket.io connections from Nodes and WebClients
 * Nodes broadcast log messages & pings to WebClients
 * WebClients request log streams & history from Nodes
 */

var io = require('socket.io');
var __ = require('underscore');
var _node = require('./node.js');
var _wc = require('./web_client.js');
var STATUS_INTERVAL = 60 * 1000; // 60 seconds
var HEARTBEAT_INTERVAL = 20 * 1000; // 20 seconds
var LOGGER = function(msg) {
  console.log((new Date().toTimeString().slice(0,8)) + " - " + msg);
}

// LogServer runs a regular HTTP server
// Announce messages add each client to the appropriate pools
var LogServer = function(http_server) {
  this.http_server = http_server;
  this.nodes = {};
  this.web_clients = {};
  this.node_sessions = [];
  this.web_client_sessions = [];
  this.message_count = 0;
  var log_server = this;

  // Print status every minute
  setInterval(function() {
    LOGGER("Nodes: " + __(log_server.nodes).size() + ", " +
      "WebClients: " + __(log_server.web_clients).size() + ", " +
      "Messages Sent: " + log_server.message_count);
  }, STATUS_INTERVAL);
}

LogServer.prototype = {

  // Create HTTP Server, bind socket
  listen: function(port) {
    this.http_server.listen(port);
    this.io = io.listen(this.http_server);
    this.register();
  },

  // Registers new Node with LogServer, announces to WebClients
  announce_node: function(client, message) {
    client.ctype = 'node';
    client.nlabel = message.label;

    // If this node already exists, ignore
    if (this.nodes[client.nlabel]) {
      LOGGER("Warning: Node '" + client.nlabel + "' already exists, ignoring");
      client.send({type: 'node_already_exists'});
      return;
    }
    var node = new _node.Node(client.nlabel, message.logs,
      client, this);
    this.nodes[client.nlabel] = node;
    this.node_sessions.push(client.sessionId);

    // Tell all WebClients about new Node
    __(this.web_clients).each(function(web_client) {
      web_client.add_node(node);
    });
  },

  // Registers new WebClient with LogServer
  announce_web_client: function(client) {
    client.ctype = 'web_client';
    var web_client = new _wc.WebClient(client, this);
    this.web_clients[client.sessionId] = web_client;
    this.web_client_sessions.push(client.sessionId);

    // Tell new WebClient about all nodes
    __(this.nodes).each(function(node, nlabel) {
      web_client.add_node(node);
    });
  },

  // Register announcement, disconnect callbacks
  register: function() {
    var log_server = this;
    this.io.on('connection', function(client) {
      client.on('message', function(message) {

        // Receive announce messages
        if (message.type == 'announce') {
          LOGGER("Registering new " + message.client_type + ": "
            + client.sessionId);
          if (message.client_type == 'node') {
            log_server.announce_node(client, message);
          } else if (message.client_type == 'web_client') {
            log_server.announce_web_client(client);
          }
        }
      });

      // Remove Node, WebClients from pool upon disconnect
      client.on('disconnect', function() {
        LOGGER(client.ctype + " " + client.sessionId + " disconnecting");
        if (client.ctype == 'node' && log_server.nodes[client.nlabel]) {
          delete log_server.nodes[client.nlabel];
          log_server.node_sessions = __(log_server.node_sessions)
            .without(client.sessionId);
        } else if (client.ctype == 'web_client') {
          delete log_server.web_clients[client.sessionId];
          log_server.web_client_sessions = __(log_server.web_client_sessions)
            .without(client.sessionId);
        }
      });
    });

    // Broadcast stats to all clients
    setInterval(function() {
      log_server.io.broadcast({
        type: 'stats',
        message_count: log_server.message_count
      }, log_server.node_sessions); // Don't send to Nodes
    }, 1000);

    // Broadcast heartbeat to all clients
    setInterval(function() {
      log_server.io.broadcast({
        type: 'heartbeat',
      });
    }, HEARTBEAT_INTERVAL); 
  }
}

exports.LogServer = LogServer;

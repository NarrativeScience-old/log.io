/* LogFile models used by LogServer
 * LogFile broadcasts log, ping messages to pertinent WebClients
 */

var __ = require('underscore');

// LogFile is a file that resides on a Node
var LogFile = function(label, node) {
  this.node = node;
  this.label = label;
  this._enabled = false;
  this.web_clients = [];
}

LogFile.prototype = {

  // to_string()
  name: function() {
    return this.node.label + ":" + this.label;
  },

  // Generic broadcast method all WebClients watching this LogFile
  _broadcast: function(message) {
    __(this.web_clients).each(function(wc) {
      wc.send(message);
    });
  },

  // Broadcast log message to listening WebClients
  broadcast_log: function(message) {
    this._broadcast(message);
  },

  // Broadcast ping to all WebClients
  broadcast_ping: function(message) {
    var log_server = this.node.log_server;
    log_server.message_count++;
    log_server.io.broadcast(message, log_server.node_sessions);
  },

  // Add WebClient to pool, optionally enable LogFile
  add_web_client: function(client) {
    if (this.web_clients.length == 0) { this.enable(); }
    this.web_clients.push(client);
  },

  // Remove WebClient from pool, optionally disable LogFile
  remove_web_client: function(client) {
    this.web_clients = __(this.web_clients).without(client);
    if (this.web_clients.length == 0) { this.disable(); }
  },

  // Tell Node to send log tail
  request_history: function(client, history_id) {
    this.node.client.send({
      type: 'history_request',
      client_id: client.sessionId,
      history_id: history_id,
      log_file: this.label
    });
  },

  // Tell Node to start sending log messages
  enable: function() {
    this._enabled = true;
    this.node.client.send({
      type: 'enable_log',
      log_file: this.label
    });
  },

  // Tell Node to stop sending log messages
  disable: function() {
    this.node.client.send({
      type: 'disable_log',
      log_file: this.label
    });
    this._enabled = false;
  }
}

module.exports = {
  LogFile: LogFile
}

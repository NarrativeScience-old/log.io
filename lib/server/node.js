/* Node models used by LogServer
 * Nodes listen for log, ping & history_response messages from harvesters
 */

var __ = require('underscore');
var lf = require('./log_file.js');

// Node is a server/machine/instance running a harvester
// It has nothing to do with node.js
var Node = function(label, logs, client, server) {
  this.label = label;
  this.client = client;
  this.log_server = server;
  this.log_files = {};
  var node = this;

  // Create LogFiles
  __(logs).each(function(llabel, num) {
    var log_file = new lf.LogFile(llabel, node);
    node.log_files[llabel]= log_file;
  });

  // Register log, ping, log_history requests from Node
  client.on('message', function(message) {

    // Broadcast log messages to WebClients
    if (message.type == 'log') {
      var lf = node.log_files[message.log_file];
      lf.broadcast_log(message);

    // Ping WebClient
    } else if (message.type == 'ping') {
      var lf = node.log_files[message.log_file];
      lf.broadcast_ping(message);

    // Send log history response to WebClient
    } else if (message.type == 'history_response') {
      var wc = node.log_server.web_clients[message.client_id];
      wc.client.send(message);
    }
  });

  // Notify all WebClients upon disconnect
  client.on('disconnect', function() {
    __(node.log_server.web_clients).each(function(web_client, sessionId) {
      web_client.remove_node(node);
    });
  });
}

module.exports = {
  Node: Node
}

/* WebClient model used by LogServer
 * WebClient listens for enable/disable & history_request messages,
 * sends node announcements to client
 */

var __ = require('underscore');

// WebClient is an end-user using a browser
var WebClient = function(client, server) {
  this.log_server = server;
  this.client = client;
  this.watching_logs = [];
  var wc = this;

  // Register enable/disable, add/remove log, log_history callbacks
  client.on('message', function(message) {
    var log_file = wc.get_log_file(message.node, message.log_file);
    if (log_file == null) { return; }

    // Start watching LogFile
    if (message.type == 'enable_log') {
      log_file.add_web_client(client);
      wc.watching_logs.push(log_file);

    // Stop watching LogFile
    } else if (message.type == 'disable_log') {
      log_file.remove_web_client(client);
      wc.watching_logs = __(wc.watching_logs).without(log_file);

    // Forward log history request to Node
    } else if (message.type == 'history_request') {
      log_file.request_history(client, message.history_id);
    }
  });

  // Remove WebClient from LogFiles
  client.on('disconnect', function() {
    __(wc.watching_logs).each(function(log_file) {
      log_file.remove_web_client(client);
    });
  });
}

WebClient.prototype = {

  // Lookup LogFile by label
  get_log_file: function(nlabel, llabel) {
    if (this.log_server.nodes[nlabel]) {
        return this.log_server.nodes[nlabel].log_files[llabel];
    } else {
        return null;
    }
  },

  // Tell WebClient to add new Node, LogFiles
  add_node: function(node) {
    this.client.send({
      type: 'add_node',
      node: node.label,
      logs: __(node.log_files).keys()
    });
  },

  // Tell WebClient to remove Node, LogFiles
  remove_node: function(node) {
    this.client.send({
      type: 'remove_node',
      node: node.label
    });
  }
}

module.exports = {
  WebClient: WebClient
}

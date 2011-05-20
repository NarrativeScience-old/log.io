/* Log.io WebClient application logic
 * Sends enable/disable stream & log history requests to LogServer
 * Listens for ping & log messages from enabled Nodes
 */

// In browser context, models & underscore already exist in global scope.
// For unit tests, they must be explicitly imported.
// TODO: Use browserify (https://github.com/substack/node-browserify)
if (typeof _node === 'undefined') {
  var _node = require('./node.js');
  var _stream = require('./stream.js');
  var _history = require('./history.js');
  var _cm = require('./color_manager.js');
  var _ = require('underscore');
}

// WebClient is instantiated by a browser.  It contains the socket connection,
// as well as Node, Stream, and Histories pools.
var WebClient = function(io) {
  this.nodes = {};
  this.streams = {};
  this.histories = {};
  this.stats = {
    messages: 0,
    nodes: 0,
    log_files: 0,
    start: new Date()
  };
  this.colors = new _cm.ColorManager();
  this.connected = false;
  var wc = this;

  // Create socket
  this.socket = new io.Socket(null, {
    rememberTransport: false,
    transports: ['websocket', 'flashsocket']
  });

  // Register connect callback
  this.socket.on('connect', function() {
    wc.connected = true;
    wc.socket.send({type: 'announce', client_type: 'web_client'});
  });

  // Register add/remove node, log, history_response callbacks from LogServer
  this.socket.on('message', function (message) {

    // Add a new Node to pool
    if (message.type == 'add_node') {
      wc.add_node(message.node, message.logs);

    // Remove Node from pool
    } else if (message.type == 'remove_node') {
      wc.remove_node(message.node);

    // Render new log message to screen
    } else if (message.type == 'log') {
      var log_file = wc.nodes[message.node].log_files[message.log_file];
      log_file.log(message.msg);

    // LogFile ping
    } else if (message.type == 'ping') {
      var log_file = wc.nodes[message.node].log_files[message.log_file];
      log_file.ping();
      wc.stats.messages++;

    // Render history response to screen
    } else if (message.type == 'history_response') {
      var history = wc.histories[message.history_id];
      history.add_lines(message.lines);

    // Update total message count stats
    } else if (message.type == 'stats') {
      if (!wc.stats.message_offset) {
        wc.stats.message_offset = message.message_count;
      }
      wc.stats.messages = message.message_count - wc.stats.message_offset;
    }
  });

  // Connect socket
  this.socket.connect();
}

WebClient.prototype = {

  // Add a new Node to pool
  add_node: function(nlabel, logs) {
    var node = new _node.Node(nlabel, logs, this);
    node.render();
    this.nodes[nlabel] = node;
    this.stats.nodes++;
    this.stats.log_files += _(node.log_files).size();
  },

  // Remove Node from pool
  remove_node: function(nlabel) {
    var node = this.nodes[nlabel];
    node.destroy();
    this.stats.nodes--;
    this.stats.log_files -= _(node.log_files).size();
    delete this.nodes[node.label];
  },

  // Render all LogFiles & Stream/History screens
  // Useful for screen open/closing
  rerender: function() {
    _(this.nodes).each(function(node, nlabel) {
      _(node.log_files).each(function(log_file, llabel) {
        log_file.render();
      });
    });
    _([this.streams, this.histories]).each(function(screens, num) {
      _(screens).each(function(screen, slabel) {
        if (screen.num-1 > num) { screen.num -= 1; }
      });
    });
  },

  // Resize screens, defined in web_client.jquery.js
  resize: function() { throw Error("WebClient.resize() not defined"); },

  // Create & render new Stream screen
  add_stream: function() {
    var stream = new _stream.Stream(this);
    this.streams[stream._id] = stream;
    stream.render();
    this.rerender();
  },

  // Close & destroy Stream screen
  remove_stream: function(stream) {
    stream.destroy();
    delete this.streams[stream._id];
    this.rerender();
  },

  // Create & render new History screen
  add_history: function() {
    var history = new _history.History(this);
    this.histories[history._id] = history;
    history.render();
    this.rerender();
  },

  // Close & destroy History screen
  remove_history: function(history) {
    history.destroy();
    delete this.histories[history._id];
    this.rerender();
  }
}

// Export for nodeunit tests
try {
  exports.WebClient = WebClient;
} catch(err) {}

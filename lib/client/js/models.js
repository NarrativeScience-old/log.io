/* Node, LogFile, Stream, History model definitions for Log.io web client
 */

// Node is a machine/server/instance running a LogHarvester
// Contains label mapping to LogFile instances
var Node = function(label, logs, web_client) {
  this._dom;
  this.label = label;
  this.log_files = {};
  this.web_client = web_client;
  var node = this;

  // Create new LogFiles
  _(logs).each(function(llabel, num) {
    var log_file = new LogFile(node, llabel);
    node.log_files[llabel] = log_file;
  });
}

Node.prototype = {
  render: function() { throw "Node.render() not defined"; },
  destroy: function() { throw "Node.destroy() not defined"; }
};

// LogFile is a file on a Node's filesystem.
// Users can enable/disable streams, and view histories
var LogFile = function(node, label) {
  this._dom;
  this.node = node;
  this.label = label;
  this.streams = {};
  this.histories = {};
  this._enabled = false;
}

LogFile.prototype = {
  log: function(msg) {
    this.ping();
    var log = this;
    _(this.streams).each(function(stream, sid) {
      stream.log(log, msg);
    });
  },
  attach_stream: function(stream) {
    if (!this._enabled) {
      this.color = this.node.web_client.colors.next();
    }
    stream.add_log_file(this);
    this.streams[stream._id] = stream;
    if (!this._enabled) {
      this._enabled = true;

      // Tell server to watch log file
      this.node.web_client.socket.send({
        type: 'enable_log', //'attach_stream',
        node: this.node.label,
        log_file: this.label
      });
    }
  },
  detach_stream: function(stream) {
    stream.remove_log_file(this);
    delete this.streams[stream._id];
    if (!this.is_enabled() && this.color) {
      this.node.web_client.colors.release(this.color);
      this.color = null;
    }
    this._enabled = this.is_enabled();
    if (!this._enabled) {

      // Tell server we don't care about log file anymore
      this.node.web_client.socket.send({
        type: 'disable_log', //'detach_stream',
        node: this.node.label,
        log_file: this.label
      });
    }
  },
  enable_history: function(history) {
    if (history.log_file) {
      history.log_file.disable_history(history._id);
    }
    history.add_log_file(this);
    this.histories[history._id] = history;
  },
  disable_history: function(history) {
    delete this.histories[history._id];
  },
  view_history: function(history) {
    history.get_history(this);
    this.enable_history(history);
  },
  is_enabled: function() {
    return _(this.streams).size() > 0;
  },
  render: function() { throw "LogFile.render() not defined." },
  ping: function() { throw "LogFile.ping() not defined." }
};

// Stream screens show live changes from multiple LogFiles
var Stream = function(web_client) {
  this._dom;
  this._id = String(new Date().getTime());
  this._paused = false;
  this.log_files = {};
  this.highlight = null;
  this.highlight_count = 0;
  this.web_client = web_client;
  this.num = _(this.web_client.streams).size() + 1;
};

Stream.prototype = {
  add_log_file: function(log_file) {
    if (!this.log_files[log_file.node.label]) {
      this.log_files[log_file.node.label] = {};
    }
    if (!this.log_files[log_file.node.label][log_file.label]) {
      this.log_files[log_file.node.label][log_file.label] = log_file;
    }
  },
  remove_log_file: function(log_file) {
    delete this.log_files[log_file.node.label][log_file.label];
  },
  close: function() {
    var stream = this;
    _(this.log_files).each(function(log_files, nlabel) {
      _(log_files).each(function(log_file, llabel) {
        log_file.detach_stream(stream);
      });
    });
    this.web_client.remove_stream(stream);
  },
  get_label: function() {
    var label = "Stream " + this.num;
    return label;
  },
  add_highlight: function(regex) {
    this.highlight = regex;
  },
  remove_highlight: function() {
    this.highlight = null;
    this.highlight_count = 0;
  },
  pause: function() { this._paused = true; },
  start: function() { this._paused = false; },
  render: function() { throw "Stream.render() not defined"; },
  destroy: function() { throw "Stream.destroy() not defined"; },
  log: function(log_file, msg) { throw "Stream.log() not defined"; }
};

// History screens show the last ~1000 lines of a LogFile
var History = function(web_client) {
  this._dom;
  this._id = String(new Date().getTime());
  this.log_file = null;
  this.highlight = null;
  this.highlight_count = 0;
  this.web_client = web_client;
  this.num = _(web_client.histories).size() + 1;
};

History.prototype = {
  get_history: function(log_file) {
    this.web_client.socket.send({
      type: 'history_request',
      node: log_file.node.label,
      log_file: log_file.label,
      history_id: this._id
    });
  },
  add_log_file: function(log_file) {
    this.log_file = log_file;
  },
  close: function() {
    this.web_client.remove_history(this);
  },
  get_label: function() {
    var label = "History " + this.num;
    if (this.log_file) {
      label += " - " + this.log_file.node.label + ":" + this.log_file.label;
    };
    return label;
  },
  add_highlight: function(regex) {
    this.highlight = regex;
  },
  remove_highlight: function() {
    this.highlight = null;
    this.highlight_count = 0;
  },
  render: function() { throw "History.render() not defined"; },
  destroy: function() { throw "History.destroy() not defined"; },
  add_lines: function(lines) { throw "History.add_lines() not defined"; }
};

try {
  module.exports = {
    Node: Node,
    LogFile: LogFile,
    Stream: Stream,
    History: History
  }
} catch(err) {}

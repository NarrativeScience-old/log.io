/* Nodeunit tests for WebClient
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var _node = require('../../lib/client/js/node.js');
var _stream = require('../../lib/client/js/stream.js');
var _history = require('../../lib/client/js/history.js');
var _cm = require('../../lib/client/js/color_manager.js');

var WebClient = require('../../lib/client/js/web_client.js').WebClient;

// Test constants
var TEST_DATE = 999;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    // Stub out Date()
    this._orig_date = Date;
    Date = function() { this.getTime = function() { return TEST_DATE; } };

    // Stub out ColorManager()
    _cm.ColorManager = function(){};

    // Fake Socket.io
    var io = {
      Socket: function(host, opts) {
        return {
          host: host,
          opts: opts,
          events: {},
          sent_messages: [],
          on: function(event, callback) {
            this.events[event] = callback;
          },
          connect: function() {
            this.trigger_event('connect');
          },
          send: function(msg) {
            this.sent_messages.push(msg);
          },
          trigger_event: function(event, data) {
            this.events[event](data);
          }
        }
      }
    }
    this.obj_ut = new WebClient(io);
    callback();
  },

  tearDown: function(callback) {
    Date = this._orig_date;
    callback();
  },

  test_constructor: function(test) {
    test.deepEqual({}, this.obj_ut.nodes);
    test.deepEqual({}, this.obj_ut.streams);
    test.deepEqual({}, this.obj_ut.histories);
    test.deepEqual({
      messages: 0,
      nodes: 0,
      log_files: 0,
      start: new Date(),
    }, this.obj_ut.stats);
    test.deepEqual(new _cm.ColorManager(), this.obj_ut.colors);
    test.done();
  },

  test_socket_init: function(test) {
    test.equal(null, this.obj_ut.socket.host);
    test.deepEqual({
      rememberTransport: false,
      transports: ['websocket', 'flashsocket'],
    }, this.obj_ut.socket.opts);
    test.done();
  },

  test_socket_connect: function(test) {
    test.ok(this.obj_ut.connected);
    test.deepEqual([{
      type: 'announce',
      client_type: 'web_client'
    }], this.obj_ut.socket.sent_messages);
    test.done();
  },

  test_add_node_message: function(test) {
    // Stub out add_node()
    var add_node_node;
    var add_node_logs;
    this.obj_ut.add_node = function(node, logs) {
      add_node_node = node;
      add_node_logs = logs;
    }
    var server_message = {type: 'add_node', node: 'node1', logs: 'logs1'};
    this.obj_ut.socket.trigger_event('message', server_message);
    test.equal(server_message.node, add_node_node);
    test.equal(server_message.logs, add_node_logs);
    test.done();
  },

  test_remove_node_message: function(test) {
    // Stub out remove_node()
    var remove_node_node;
    this.obj_ut.remove_node = function(node) {
      remove_node_node = node;
    }
    var server_message = {type: 'remove_node', node: 'node1'};
    this.obj_ut.socket.trigger_event('message', server_message);
    test.equal(server_message.node, remove_node_node);
    test.done();
  },

  test_log_message: function(test) {
    var server_message = {type: 'log', node: 'node1',
      log_file: 'log1', msg: 'msg1'};
    // Fake LogFile
    var logged_message;
    this.obj_ut.nodes = {
      node1: {
        log_files: {
          log1: {
            log: function(msg) {
              logged_message = msg;
            }
          }
        }
      }
    }
    this.obj_ut.socket.trigger_event('message', server_message);
    test.equal('msg1', logged_message);
    test.done();
  },

  test_history_response: function(test) {
    var server_message = {type: 'history_response', history_id: '123',
      lines: ['line1', 'line2']};
    // Fake History Screen
    var added_lines;
    this.obj_ut.histories = {
      '123': {
        add_lines: function(lines) {
          added_lines = lines;
        }
      }
    }
    this.obj_ut.socket.trigger_event('message', server_message);
    test.deepEqual(server_message.lines, added_lines);
    test.done();
  },

  test_stats_message: function(test) {
    var server_message = {type: 'stats', message_count: 699};
    this.obj_ut.socket.trigger_event('message', server_message);
    test.equal(699, this.obj_ut.stats.messages);
    test.done();
  },

  test_add_node: function(test) {
    // Stub out Node()
    var node_rendered = false;
    var nlabel = 'node1';
    var logs = {'log1': {}, 'log2': {}};
    this.obj_ut.stats.nodes = 0;
    this.obj_ut.stats.log_files = 0;
    _node.Node = function(nlabel, logs, web_client) {
      this.render = function() {
        node_rendered = true;
      },
      this.log_files = logs;
    }
    this.obj_ut.add_node(nlabel, logs);
    test.ok(node_rendered);
    test.ok(this.obj_ut.nodes[nlabel]);
    test.equal(1, this.obj_ut.stats.nodes);
    test.equal(2, this.obj_ut.stats.log_files);
    test.done();
  },

  test_remove_node: function(test) {
    var nlabel = 'node1';
    var logs = {'log1': {}, 'log2': {}};
    var node_destroyed = false;
    this.obj_ut.nodes[nlabel] = {
      destroy: function() {
        node_destroyed = true;
      },
      label: nlabel,
      log_files: logs
    }
    this.obj_ut.stats.nodes = 1;
    this.obj_ut.stats.log_files = 2;
    this.obj_ut.remove_node(nlabel);
    test.ok(node_destroyed);
    test.equal(0, this.obj_ut.stats.nodes);
    test.equal(0, this.obj_ut.stats.log_files);
    test.deepEqual({}, this.obj_ut.nodes);
    test.done();
  },

  test_rerender: function(test) {
    var log_files_rendered = {};
    var LogFile = function(label) {
      this.render = function() {
        log_files_rendered[label] = true;
      }
    }
    this.obj_ut.nodes = {
      'node1': {
        'log_files': {
          'log1' : new LogFile('log1'),
          'log2' : new LogFile('log2')
        }
      },
      'node2' : {
        'log_files': {
          'log3' : new LogFile('log3'),
          'log4' : new LogFile('log4')
        }
      }
    }
    this.obj_ut.streams = {'stream1': {'num':1}, 'stream2': {'num':3}};
    this.obj_ut.histories = {'hist1': {'num':1}, 'hist2': {'num':3}};
    this.obj_ut.rerender();
    __(['log1', 'log2', 'log3', 'log4']).each(function(llabel) {
      test.ok(log_files_rendered[llabel]);
    });
    test.deepEqual({'stream1': {'num':1}, 'stream2': {'num':2}},
      this.obj_ut.streams);
    test.deepEqual({'hist1': {'num':1}, 'hist2': {'num':2}},
      this.obj_ut.histories);
    test.done();
  },

  test_resize: function(test) {
    var t = this;
    test.throws(function() {
      t.resize();
    });
    test.done();
  },

  test_add_stream: function(test) {
    // Stub out Stream()
    var render_called = false;
    _stream.Stream = function(web_client) {
      this._id = '6699';
      this.render = function() {
        render_called = true;
      }
    }
    // Stub out rerender()
    var rerender_called = false;
    this.obj_ut.rerender = function() {
      rerender_called = true;
    }
    this.obj_ut.add_stream();
    test.ok(render_called);
    test.ok(rerender_called);
    test.ok(this.obj_ut.streams['6699']);
    test.done();
  },

  test_remove_stream: function(test) {
    var destroy_called = false;
    var fake_stream = {
      _id: '7788',
      destroy: function() {
        destroy_called = true;
      }
    }
    this.obj_ut.streams = {'7788': fake_stream};
    // Stub out rerender()
    var rerender_called = false;
    this.obj_ut.rerender = function() {
      rerender_called = true;
    }
    this.obj_ut.remove_stream(fake_stream);
    test.ok(destroy_called);
    test.ok(rerender_called);
    test.deepEqual({}, this.obj_ut.streams);
    test.done();
  },

  test_add_history: function(test) {
    // Stub out History()
    var render_called = false;
    _history.History = function(web_client) {
      this._id = '6699';
      this.render = function() {
        render_called = true;
      }
    }
    // Stub out rerender()
    var rerender_called = false;
    this.obj_ut.rerender = function() {
      rerender_called = true;
    }
    this.obj_ut.add_history();
    test.ok(render_called);
    test.ok(rerender_called);
    test.ok(this.obj_ut.histories['6699']);
    test.done();
  },

  test_remove_history: function(test) {
    var destroy_called = false;
    var fake_history = {
      _id: '7788',
      destroy: function() {
        destroy_called = true;
      }
    }
    this.obj_ut.histories = {'7788': fake_history};
    // Stub out rerender()
    var rerender_called = false;
    this.obj_ut.rerender = function() {
      rerender_called = true;
    }
    this.obj_ut.remove_history(fake_history);
    test.ok(destroy_called);
    test.ok(rerender_called);
    test.deepEqual({}, this.obj_ut.histories);
    test.done();
  }
});

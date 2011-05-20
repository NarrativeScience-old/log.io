/* Nodeunit tests for LogServer Node model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var _lf = require('../../lib/server/log_file.js');
var Node = require('../../lib/server/node.js').Node;
var testCase = require('nodeunit').testCase;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this._label = 'node1';
    this._logs = ['log1', 'log2'];
    this._client = {
      socketio_client: true,
      events: {},
      sent_messages: [],
      on: function(event, callback) {
        this.events[event] = callback;
      },
      send: function(msg) {
        this.sent_messages.push(msg);
      },
      trigger_event: function(event, data) {
        this.events[event](data);
      }
    };
    this._server = {
      web_clients: {}
    };

    // Stub out LogFile
    _lf.LogFile = function(label, node) {
      this.label = label;
      this.node = node;
      this.broadcasted_logs = [];
      this.broadcasted_pings = 0;
      this.broadcast_log = function(msg) {
        this.broadcasted_logs.push(msg);
      }
      this.broadcast_ping = function() {
        this.broadcasted_pings++;
      }
    }
    var t = this;
    this.obj_ut = new Node(t._label, t._logs, t._client, t._server);
    callback();
  },

  test_constructor: function(test) {
    test.equal(this._label, this.obj_ut.label);
    test.deepEqual(this._client, this.obj_ut.client);
    test.deepEqual(this._server, this.obj_ut.log_server);
    test.deepEqual({
      'log1': this.obj_ut.log_files['log1'],
      'log2': this.obj_ut.log_files['log2']
    }, this.obj_ut.log_files);
    test.done();
  },

  test_socket_log_message: function(test) {
    var test_log_message = {
      type: 'log',
      log_file: 'log1',
      msg: 'this is log message'
    };
    this._client.trigger_event('message', test_log_message);
    test.deepEqual([test_log_message],
      this.obj_ut.log_files['log1'].broadcasted_logs);
    test.deepEqual([], this.obj_ut.log_files['log2'].broadcasted_logs);
    test.done();
  },

  test_socket_ping_message: function(test) {
    var test_ping_message = {
      type: 'ping',
      log_file: 'log1'
    };
    this._client.trigger_event('message', test_ping_message);
    test.equal(1, this.obj_ut.log_files['log1'].broadcasted_pings);
    test.equal(0, this.obj_ut.log_files['log2'].broadcasted_pings);
    test.done();
  },

  test_socket_history_response_message: function(test) {
    var test_response_message = {
      client_id: 666,
      type: 'history_response'
    };
    this._server.web_clients = {666: {client: this._client}};
    this._client.trigger_event('message', test_response_message);
    test.deepEqual([test_response_message], this._client.sent_messages);
    test.done();
  },

  test_disconnect: function(test) {
    var test_client = {
      removed_nodes: [],
      remove_node: function(node) {
        this.removed_nodes.push(node);
      }
    }
    this._server.web_clients = {
      666: test_client
    }
    this._client.trigger_event('disconnect');
    test.deepEqual([this.obj_ut], test_client.removed_nodes);
    test.done();
  }
});

/* Nodeunit tests for LogServer's LogFile model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var LogFile = require('../../lib/server/log_file.js').LogFile;
var testCase = require('nodeunit').testCase;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    var t = this;
    this._node = {
      label: 'node1',
      log_server: {
        sent_messages: [],
        message_count: 0,
        io: {
          sockets: {
            in: function(room) {
              return {
                emit: function(event, msg) {
                  t._node.log_server.sent_messages.push([event, msg]);
                }
              }
            }
          }
        }
      },
      socket: {
        sent_messages: [],
        emit: function(event, msg) {
          this.sent_messages.push([event, msg]);
        }
      }
    };
    this._label = 'label1';
    this.obj_ut = new LogFile(this._label, this._node);
    callback();
  },

  test_constructor: function(test) {
    test.equal(this._node, this.obj_ut.node);
    test.equal(this._label, this.obj_ut.label);
    test.equal(this._node.label + ":" + this._label, this.obj_ut.room);
    test.ok(!this.obj_ut._enabled);
    test.deepEqual([], this.obj_ut.web_clients);
    test.done();
  },

  test_broadcast: function(test) {
    var test_message = {msg: 'test message'};
    this.obj_ut._broadcast('test', test_message);
    test.deepEqual([['test', test_message]],
      this._node.log_server.sent_messages);
    test.done();
  },

  test_broadcast_log: function(test) {
    var test_message = {msg: 'stuff'};
    this.obj_ut.broadcast_log(test_message);
    test.deepEqual([['log',test_message]],
      this._node.log_server.sent_messages);
    test.done();
  },

  test_broadcast_ping: function(test) {
    var test_message = {msg: 'stuff'};
    this.obj_ut.broadcast_ping(test_message);
    test.deepEqual([['ping',test_message]],
      this._node.log_server.sent_messages);
    test.equal(1, this.obj_ut.node.log_server.message_count);
    test.done();
  },

  test_add_web_client: function(test) {
    // Stub out enable()
    var enable_called = false;
    this.obj_ut.enable = function() { enable_called = true; }
    var test_client = {
      who: 'client',
      joined_rooms: [],
      socket: {
        join: function(room) {
          test_client.joined_rooms.push(room);
        }
      }
    };

    // Test with no clients
    this.obj_ut.add_web_client(test_client);
    test.ok(enable_called);
    test.deepEqual([test_client], this.obj_ut.web_clients);
    test.deepEqual([this.obj_ut.room], test_client.joined_rooms);

    // Test with existing clients
    var test_client2 = {
      who: 'client2',
      joined_rooms: [],
      socket: {
        join: function(room) {
          test_client2.joined_rooms.push(room);
        }
      }
    };
    enable_called = false;
    this.obj_ut.add_web_client(test_client2);
    test.ok(!enable_called);
    test.deepEqual([test_client, test_client2], this.obj_ut.web_clients);
    test.deepEqual([this.obj_ut.room], test_client2.joined_rooms);
    test.done();
  },

  test_remove_web_client: function(test) {
    // Stub out disable()
    var disable_called = false;
    this.obj_ut.disable = function() { disable_called = true; }
    var test_client = {
      who: 'client',
      left_rooms: [],
      socket: {
        leave: function(room) {
          test_client.left_rooms.push(room);
        }
      }
    };
    var test_client2 = {
      who: 'client2',
      left_rooms: [],
      socket: {
        leave: function(room) {
          test_client2.left_rooms.push(room);
        }
      }
    };
    this.obj_ut.web_clients = [test_client, test_client2];

    // Test with multiple clients
    this.obj_ut.remove_web_client(test_client);
    test.ok(!disable_called);
    test.deepEqual([test_client2], this.obj_ut.web_clients);
    test.deepEqual([this.obj_ut.room], test_client.left_rooms);

    // Test with one remaining client
    this.obj_ut.remove_web_client(test_client2);
    test.ok(disable_called);
    test.deepEqual([], this.obj_ut.web_clients);
    test.deepEqual([this.obj_ut.room], test_client2.left_rooms);
    test.done();
  },

  test_request_history: function(test) {
    var test_client = {id: 666};
    var test_history_id = 777;
    this.obj_ut.request_history(test_client, test_history_id);
    test.deepEqual([['history_request', {
      client_id: 666,
      history_id: 777,
      log_file: this._label
    }]], this._node.socket.sent_messages);
    test.done();
  },

  test_enable: function(test) {
    this.obj_ut._enabled = false;
    this.obj_ut.enable();
    test.deepEqual([['enable_log', {
      log_file: this._label
    }]], this._node.socket.sent_messages);
    test.ok(this.obj_ut._enabled);
    test.done();
  },

  test_disable: function(test) {
    this.obj_ut._enabled = true;
    this.obj_ut.disable();
    test.deepEqual([['disable_log', {
      log_file: this._label
    }]], this._node.socket.sent_messages);
    test.ok(!this.obj_ut._enabled);
    test.done();
  }
});

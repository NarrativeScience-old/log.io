/* Nodeunit tests for Base HTTP Server
 * https://github.com/caolan/nodeunit
 */

// Imports
var io = require('socket.io');
var __ = require('underscore');
var _node = require('../../lib/server/node.js');
var _wc = require('../../lib/server/web_client.js');
var testCase = require('nodeunit').testCase;
var LogServer = require('../../lib/server/log_server.js').LogServer;

// Stub out logger to suppress log messages
var FAKE_LOGGER = {
  debug: function(msg){},
  info: function(msg){},
  warn: function(msg){},
  error: function(msg){}
}

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    // Stub out setInterval()
    this._orig_setInterval = setInterval;
    setInterval = function(){};
    this.http_server = {};
    this.obj_ut = new LogServer(this.http_server);
    this.obj_ut._log = FAKE_LOGGER;
    callback();
  },

  tearDown: function(callback) {
    setInterval = this._orig_setInterval;
    callback();
  },

  test_constructor: function(test) {
    test.deepEqual(this.http_server, this.obj_ut.http_server);
    test.deepEqual({}, this.obj_ut.nodes);
    test.deepEqual({}, this.obj_ut.web_clients);
    test.equal(0, this.obj_ut.message_count);
    test.done();
  },

  test_listen: function(test) {
    // Stub out Socket.io
    var io_listening = false;
    io.listen = function() {
      io_listening = true;
    }

    // Stub out http server
    var http_listening = false;
    this.obj_ut.http_server.listen = function() {
      http_listening = true;
    }

    // Stub out register()
    var registered = false;
    this.obj_ut.register = function() {
      registered = true;
    }

    this.obj_ut.listen();
    test.ok(io_listening);
    test.ok(http_listening);
    test.ok(registered);
    test.done();
  },

  test_announce_node: function(test) {
    // Stub out models.Node()
    _node.Node = function(nlabel, logs, web_client, log_server) {
      this.nlabel = nlabel;
      this.logs = logs;
      this.web_client = web_client;
      this.log_server = log_server;
    }

    // Test socket.io client
    var test_client = {
      sent_messages: [],
      events: {},
      emit: function(event, msg) {
        this.sent_messages.push([event, msg]);
      },
      on: function(event, callback) {
        this.events[event] = callback;
      },
      trigger_event: function(event, data) {
        this.events[event](data);
      },
      nlabel: 'node1'
    }

    // Test server message
    var server_message = {
      label: 'node1',
      logs: {'log1': {}, 'log2': {}}
    }

    // Fake out web_clients
    var fake_web_client = {
      node: null,
      add_node: function(node) {
        this.node = node;
      }
    }
    this.obj_ut.web_clients = [fake_web_client, fake_web_client];
    this.obj_ut.announce_node(test_client, server_message);
    var test_node = this.obj_ut.nodes[test_client.nlabel]
    test.equal(test_client.nlabel, test_node.nlabel);
    test.deepEqual(server_message.logs, test_node.logs);
    test.deepEqual(test_client, test_node.web_client);
    test.deepEqual(this.obj_ut, test_node.log_server);
    __(this.obj_ut.web_clients).each(function(wc) {
      test.ok(wc.node);
    });

    // Announce node that already exists
    var new_node_created = false;
    _node.Node = function(nlabel, logs, web_client, log_server) {
      new_node_created = true;
    }
    this.obj_ut.announce_node(test_client, server_message);
    test.deepEqual([['node_already_exists', undefined]],
      test_client.sent_messages);
    test.ok(!new_node_created);
    test.done();
  },

  test_announce_web_client: function(test) {
    // Stub out models.WebClient()
    _wc.WebClient = function(web_client, log_server) {
      this.socket = web_client;
      this.log_server = log_server;
      this.nodes = [];
      this.id = web_client.id;
      this.add_node = function(node) {
        this.nodes.push(node);
      }
    }

    // Test socket.io client
    var test_client = {
      id: 666,
      sent_messages: [],
      events: {},
      emit: function(event, msg) {
        this.sent_messages.push([event, msg]);
      },
      on: function(event, callback) {
        this.events[event] = callback;
      },
      trigger_event: function(event, data) {
        this.events[event](data);
      }
    }

    // Fake nodes
    this.obj_ut.nodes = {
      'node1' : 'node1_object',
      'node2' : 'node2_object'
    }

    this.obj_ut.announce_web_client(test_client);
    var web_client = this.obj_ut.web_clients[666];
    test.deepEqual(test_client, web_client.socket);
    test.deepEqual(this.obj_ut, web_client.log_server);
    test.deepEqual(['node1_object','node2_object'], web_client.nodes);
    test.done();
  },

  test_register: function(test) {
    // Stub out client callbacks
    var fake_client = {
      id: 666,
      events: {},
      on: function(event, callback) {
        this.events[event] = callback;
      },
      trigger_event: function(event, data) {
        this.events[event](data);
      }
    }

    // Stub out connection callback
    var t = this;
    this.obj_ut.io = {
      set: function(k,v){},
      sockets: {
        events: {},
        broadcasts: [],
        room_broadcasts: {},
        on: function(event, callback) {
          this.events[event] = callback;
        },
        in: function(room) {
          t.obj_ut.io.sockets.room_broadcasts[room] = [];
          return {
            emit: function(event, message) {
              t.obj_ut.io.sockets.room_broadcasts[room] = [event, message];
            }
          }
        },
        emit: function(event, message) {
          this.broadcasts.push([event, message]);
        },
        trigger_event: function(event, data) {
          this.events[event](data);
        }
      }
    }

    // Stub out setInterval
    var _orig_setInterval = setInterval
    setInterval = function(callback, interval) {
      callback();
    }

    this.obj_ut.register();
    this.obj_ut.io.sockets.trigger_event('connection', fake_client);

    // Stub out announce_node
    var n_announce_client;
    var n_announce_message;
    this.obj_ut.announce_node = function(client, message) {
      n_announce_client = client;
      n_announce_message = message;
    }

    // Stub out announce_web_client
    var w_announce_client;
    this.obj_ut.announce_web_client = function(client) {
      w_announce_client = client;
    }

    // Announce web client
    var wc_announce_message = {};
    fake_client.trigger_event('announce_web_client');
    test.deepEqual(fake_client, w_announce_client);

    // Announce node
    var announce_message = {client_type: 'node'};
    fake_client.trigger_event('announce_node', announce_message);
    test.deepEqual(fake_client, n_announce_client);
    test.deepEqual(announce_message, n_announce_message);

    // Ensure stats & heartbeats are being broadcasted
    test.deepEqual([['heartbeat', undefined]],
      this.obj_ut.io.sockets.broadcasts);
    test.deepEqual({web_clients: ['stats', {message_count: 0}]},
      this.obj_ut.io.sockets.room_broadcasts)
    // Restore setInterval
    setInterval = _orig_setInterval;
    test.done();
  }
});

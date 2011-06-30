/* Nodeunit tests for Log Harvester
 * https://github.com/caolan/nodeunit
 */

// Imports
var fs = require('fs');
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var io = require('Socket.io-node-client/io-client.js').io;
var lf = require('../../lib/harvester/log_file.js');
var LogHarvester = require('../../lib/harvester/log_harvester.js').LogHarvester;

// Stub out Socket.io
io.Socket = function(host, opts) {
  return {
    host: host,
    opts: opts,
    _send: [],
    _on: {},
    on: function(event, callback) {
      this._on[event] = callback;
    },
    connect: function() {
      if (this._on.connect) {
        this._on.connect();
      }
    },
    send: function(msg) {
      this._send.push(msg);
    },
    trigger_event: function(event, message) {
      this._on[event](message);
    }
  }
}

// Stub out LogFile
lf.LogFile = function(path, label, harvester) {
  return {
    path: path,
    label: label,
    watched: false,
    harvester: harvester,
    enable: function() { this.enabled = true; },
    disable: function() { this.disabled = true; },
    send_history: function(cid, hid) {
      this.send_history_args = [cid,hid];
    },
    watch: function() { this.watched = true; }
  }
}

// Stub out console.log to suppress logging
console.log = function(){}
var TEST_CONFIG = {
  'server' : {
    'host' : 'server.host.com',
    'port' : 666
  },
  'log_file_paths' : {
    'log1' : '/path/to/log/1',
    'log2' : '/path/to/log/2'
  },
  'encoding': 'utf8',
  'instance_name': 'node1'
};

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this.obj_ut = new LogHarvester(TEST_CONFIG);
    this.obj_ut.connect();
    callback();
  },

  test_missing_configs: function(test) {
    test.throws(function() {
      LogHarvester();
    });
    test.throws(function() {
      LogHarvester({logs:TEST_CONFIG.logs});
    });
    test.done();
  },

  test_configs: function(test) {
    test.deepEqual(this.obj_ut._conf.server, TEST_CONFIG.server);
    test.deepEqual(this.obj_ut._conf.logs, TEST_CONFIG.logs);
    test.done();
  },

  test_log_files: function(test) {
    test.equal(TEST_CONFIG['log_file_paths']['log1'],
      this.obj_ut.log_files['log1'].path);
    test.equal('log1', this.obj_ut.log_files['log1'].label);
    test.equal(this.obj_ut, this.obj_ut.log_files['log1'].harvester);
    test.done();
  },

  test_socket_init: function(test) {
    test.equal(TEST_CONFIG['server']['host'], this.obj_ut.socket.host);
    test.equal(TEST_CONFIG['server']['port'], this.obj_ut.socket.opts.port);
    test.done();
  },

  test_socket_connect: function(test) {
    var announce_called = false;
    this.obj_ut.announce = function() { announce_called = true; }
    this.obj_ut.socket.trigger_event('connect');
    test.ok(this.obj_ut.connected);
    test.ok(announce_called);
    test.done();
  },

  test_socket_messages: function(test) {
    // Heartbeat message
    var _orig_Date = Date;
    Date = function() { this.getTime = function() { return 666; }};
    this.obj_ut.socket.trigger_event('message', {type: 'heartbeat'});
    test.equal(666, this.obj_ut.last_heartbeat);
    Date = _orig_Date;

    // Enable/disable log files
    this.obj_ut.socket.trigger_event('message',
      {type: 'enable_log', log_file: 'log1'});
    test.ok(this.obj_ut.log_files['log1'].enabled);
    this.obj_ut.socket.trigger_event('message',
      {type: 'disable_log', log_file: 'log1'});
    test.ok(this.obj_ut.log_files['log1'].disabled);

    // Send history request
    this.obj_ut.socket.trigger_event('message', {
      type: 'history_request',
      log_file: 'log1',
      client_id: 'client1',
      history_id: 'history1'
    });
    test.deepEqual(['client1', 'history1'],
      this.obj_ut.log_files['log1'].send_history_args);

    // Send node_already_exists message
    // Stub out process.exit()
    var _orig_process = process;
    var process_exited = false;
    process = {exit: function(num) { process_exited = true; }}
    this.obj_ut.socket.trigger_event('message', {
      type: 'node_already_exists',
    });
    test.ok(process_exited);
    // Restore process
    process = _orig_process;
    test.done();
  },

  test_run: function(test) {
    // Stub out setInterval()
    _orig_setInterval = setInterval;
    setInterval = function(callback, interval){};

    // Stub out connect()
    var connect_called = false;
    this.obj_ut.connect = function() {
      connect_called = true;
    }

    this.obj_ut.run();
    __(this.obj_ut.log_files).each(function(log_file, label) {
      test.ok(log_file.watched);
    });
    test.ok(this.obj_ut.connected);
    test.ok(connect_called);

    // Test heartbeat check on failed connection
    setInterval = function(callback, interval){callback();}
    this.obj_ut.last_heartbeat = 0;
    var reconnect_called = false;
    this.obj_ut.reconnect = function() { reconnect_called = true; }
    this.obj_ut.run();
    test.ok(reconnect_called);

    // Test heartbeat check on healthy connection
    this.obj_ut.last_heartbeat = new Date().getTime();
    var reconnect_called = false;
    this.obj_ut.run();
    test.ok(!reconnect_called);

    // Restore setInterval
    setInterval = _orig_setInterval;
    test.done();
  },

  test_announce: function(test) {
    this.obj_ut.announce();
    test.deepEqual({
      type: 'announce',
      client_type: 'node',
      logs: __(this.obj_ut.log_files).keys(),
      label: this.obj_ut._conf.node
    }, this.obj_ut.socket._send[0]);
    test.done();
  },

  test_reconnect: function(test) {
    // Stub out setTimeout
    _orig_setTimeout = setTimeout;
    setTimeout = function(callback, interval) { callback(); }

    // Stub out socket.connect
    var t = this;
    var connect_action = [false, false, true];
    this.obj_ut.socket.connect = function() {
      var action = connect_action.pop();
      t.obj_ut.connected = action;
    }
    // Stub out connect()
    var connect_called = false;
    this.obj_ut.connect = function() {
      connect_called = true;
    }
    this.obj_ut.reconnect();
    test.ok(this.obj_ut.connected);
    test.done();
  },

  test_send: function(test) {
    var reconnect_called = false;
    this.obj_ut.connected = true;
    this.obj_ut.reconnect = function() { reconnect_called = true; };

    // Try without exception
    this.obj_ut.socket._send = [];
    this.obj_ut._send({foo:'bar'});
    test.deepEqual({foo: 'bar'}, this.obj_ut.socket._send[0]);
    test.ok(this.obj_ut.connected);
    test.ok(!reconnect_called);

    // Try with exception
    this.obj_ut.socket.send = function(msg) { throw Error("WTF"); };
    this.obj_ut._send({foo:'bar'});
    test.ok(!this.obj_ut.connected);
    test.ok(reconnect_called);
    test.done();
  }
});

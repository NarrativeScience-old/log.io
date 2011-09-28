/* Nodeunit tests for Log File
 * https://github.com/caolan/nodeunit
 */

// Imports
var fs = require('fs');
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var lf = require('../../lib/harvester/log_file.js');

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this.test_log_file = {
      path: '/path/to/logfile',
      label: 'logfile1',
      harvester: {
        connected: true,
        encoding: 'utf8',
        message_type: 'log',
        _conf: {node: 'machineA'},
        messages_sent: 0,
        sent_messages: [],
        _send: function(event, msg) {
          this.sent_messages.push([event, msg]);
        }
      }
    }
    var l = this.test_log_file;
    this.obj_ut = new lf.LogFile(l.path, l.label, l.harvester);
    callback();
  },

  test_constructor: function(test) {
    test.equal(this.test_log_file.path, this.obj_ut.path);
    test.equal(this.test_log_file.label, this.obj_ut.label);
    test.deepEqual(this.test_log_file.harvester, this.obj_ut.harvester);
    test.done();
  },

  test_watch: function(test) {
    // Stub out LogFile.ping()
    var pinged = false;
    this.obj_ut.ping = function() { pinged = true; }
    this.obj_ut._enabled = true;

    // Stub out fs.watchFile()
    fs.watchFile = function(path, callback) {
      callback({size: 20},{size:10});
    }

    // Stub out LogFile.send_log()
    var sent_logs = [];
    this.obj_ut.send_log = function(msg) {
      sent_logs.push(msg);
    }

    // Stub out fs.createReadStream()
    var create_stream_called = false;
    var read_stream_opts;
    var fake_log_data = "line1 is a long log message that will";
    fake_log_data += " pass I guess so whatever\n";
    fake_log_data += "too short to send";
    fs.createReadStream = function(path, opts) {
      create_stream_called = true;
      read_stream_opts = opts;
      return {
        events: {},
        on: function(event, callback) {
          if (event == 'data') {
            callback(fake_log_data);
          }
        },
      }
    }

    // Test with no connection
    this.obj_ut.harvester.connected = false;
    this.obj_ut.watch();
    test.ok(!pinged);
    test.ok(!create_stream_called);

    // Test with no enabled
    this.obj_ut.harvester.connected = true;
    this.obj_ut._enabled = false;
    this.obj_ut.watch();
    test.ok(pinged);
    test.ok(!create_stream_called);

    // Test with connected + enabled
    this.obj_ut._enabled = true;
    this.obj_ut.watch();
    test.deepEqual({
      encoding: this.obj_ut.harvester._conf.encoding,
      start: 10,
      end: 20
    }, read_stream_opts);
    test.deepEqual([fake_log_data.split("\n")[0]], sent_logs);
    test.done();
  },

  test_enable: function(test) {
    this.obj_ut._enabled = false;
    this.obj_ut.enable();
    test.ok(this.obj_ut._enabled);
    this.obj_ut.enable();
    test.ok(this.obj_ut._enabled);
    test.done();
  },

  test_disable: function(test) {
    this.obj_ut._enabled = true;
    this.obj_ut.disable();
    test.ok(!this.obj_ut._enabled);
    this.obj_ut.disable();
    test.ok(!this.obj_ut._enabled);
    test.done();
  },

  test_send_log: function(test) {
    var log_message = "this is log message";
    this.obj_ut.send_log(log_message);
    test.deepEqual([[this.obj_ut.harvester._conf.message_type, {
      node: this.obj_ut.harvester._conf.node,
      log_file: this.obj_ut.label,
      msg: log_message
    }]], this.obj_ut.harvester.sent_messages);
    test.equal(1, this.obj_ut.harvester.messages_sent);
    test.done();
  },

  test_send_history: function(test) {
    var statSync_path;
    fs.statSync = function(path) {
      statSync_path = path;
      return {size: 20};
    }
    var openSync_path;
    var openSync_mode;
    fs.openSync = function(path, mode) {
      openSync_path = path;
      openSync_mode = mode;
      return {'file_descriptor': true};
    }
    var readSync_fd;
    var readSync_length;
    var readSync_start;
    var log_message = "This is a log message that we'll send.\n";
    log_message += "And more stuff too for the next line, yessir";
    fs.readSync = function(fd, length, start) {
      readSync_fd = fd;
      readSync_length = length;
      readSync_start = start;
      return [log_message, null];
    }
    var client_id = "client_id";
    var history_id = "history_id";
    this.obj_ut.send_history(client_id, history_id);

    test.equal(statSync_path, this.obj_ut.path);
    test.equal(openSync_path, this.obj_ut.path);
    test.equal(openSync_mode, 'r');
    test.deepEqual(readSync_fd, {'file_descriptor': true});
    test.equal(readSync_length, lf.HISTORY_LENGTH);
    test.equal(readSync_start, 0);
    test.deepEqual([['history_response', {
      node: this.obj_ut.harvester._conf.node,
      history_id: history_id,
      client_id: client_id,
      log_file: this.obj_ut.label,
      lines: log_message.split("\n").reverse()
    }]], this.obj_ut.harvester.sent_messages);
    test.done();
  },

  test_ping: function(test) {
    this.obj_ut.ping();
    test.deepEqual([['ping', {
      node: 'machineA',
      log_file: this.obj_ut.label
    }]], this.obj_ut.harvester.sent_messages);
    test.done();
  }
});

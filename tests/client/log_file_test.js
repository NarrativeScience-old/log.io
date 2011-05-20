/* Nodeunit tests for client-side LogFile model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var LogFile = require('../../lib/client/js/log_file.js').LogFile;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this._node = {foo: 'bar', label: 'node1'};
    this._label = 'log_file1';
    this.obj_ut = new LogFile(this._node, this._label);
    callback();
  },

  test_constructor: function(test) {
    test.equal(null, this.obj_ut._dom);
    test.deepEqual(this._node, this.obj_ut.node);
    test.equal(this._label, this.obj_ut.label);
    test.deepEqual({}, this.obj_ut.streams);
    test.deepEqual({}, this.obj_ut.histories);
    test.ok(!this.obj_ut._enabled);
    test.done();
  },

  test_log: function(test) {
    // Fake Stream object
    var test_stream = function() {
      this.log_log_file;
      this.log_msg;
      var stream = this;
      this.log = function(log_file, msg) {
        stream.log_log_file = log_file;
        stream.log_msg = msg;
      }
    }
    this.obj_ut.streams = {
      '1': new test_stream(),
      '2': new test_stream()
    }
    var test_message = 'da message';
    this.obj_ut.log(test_message);
    test.deepEqual(test_message, this.obj_ut.streams['1'].log_msg);
    test.deepEqual(this.obj_ut, this.obj_ut.streams['1'].log_log_file);
    test.deepEqual(test_message, this.obj_ut.streams['2'].log_msg);
    test.deepEqual(this.obj_ut, this.obj_ut.streams['2'].log_log_file);
    test.done();
  },

  test_attach_stream: function(test) {
    // Stub out color manager, socket_send
    var socket_send_msg = false;
    var next_color_called = false;
    this.obj_ut.node = {
      web_client : {
        colors: {
          next: function() {
            next_color_called = true;
          }
        },
        socket: {
          send: function(msg) {
            socket_send_msg = msg;
          }
        }
      }
    }
    // Fake Stream object
    var stream = {
      _id: '666',
      log_files: [],
      add_log_file: function(log_file) {
        this.log_files.push(log_file);
      }
    }
    // Test with enabled LogFile
    this.obj_ut._enabled = true;
    this.obj_ut.attach_stream(stream);
    test.ok(!next_color_called);
    test.deepEqual([this.obj_ut], stream.log_files);
    test.deepEqual({'666': stream}, this.obj_ut.streams);
    test.ok(!socket_send_msg);

    // Reset, test with disabled LogFile
    stream.log_files = [];
    this.obj_ut.streams = {};
    this.obj_ut._enabled = false;
    this.obj_ut.attach_stream(stream);
    test.ok(next_color_called);
    test.deepEqual([this.obj_ut], stream.log_files);
    test.deepEqual({'666': stream}, this.obj_ut.streams);
    test.deepEqual({
      type: 'enable_log',
      node: this.obj_ut.node.label,
      log_file: this.obj_ut.label
    }, socket_send_msg);
    test.ok(this.obj_ut._enabled);
    test.done();
  },

  test_detach_stream: function(test) {
    // Stub out color manager, socket_send
    var socket_send_msg = false;
    var released_color = false;
    this.obj_ut.node = {
      label: 'node1',
      web_client : {
        colors: {
          release: function(color) {
            released_color = color;
          }
        },
        socket: {
          send: function(msg) {
            socket_send_msg = msg;
          }
        }
      }
    }
    // Fake Stream object
    var stream = {
      _id: '666',
      removed_log_files: [],
      remove_log_file: function(log_file) {
        this.removed_log_files.push(log_file);
      }
    }
    // Test still enabled
    // Stub out is_enabled();
    this.obj_ut.is_enabled = function() {
      return true;
    }

    this.obj_ut.streams = {'666': stream};
    this.obj_ut.detach_stream(stream);
    test.deepEqual([this.obj_ut], stream.removed_log_files);
    test.deepEqual({}, this.obj_ut.streams);
    test.ok(!released_color);
    test.ok(this.obj_ut._enabled);
    test.ok(!socket_send_msg);

    // Reset, test no longer enabled
    stream.removed_log_files = [];
    this.obj_ut.streams = {'666': stream};
    this.obj_ut.color = 'hot pink';
    this.obj_ut.is_enabled = function() {
      return false;
    }
    this.obj_ut.detach_stream(stream);
    test.deepEqual([this.obj_ut], stream.removed_log_files);
    test.deepEqual({}, this.obj_ut.streams);
    test.equal('hot pink', released_color);
    test.equal(null, this.obj_ut.color);
    test.ok(!this.obj_ut._enabled);
    test.deepEqual({
      type: 'disable_log',
      node: this.obj_ut.node.label,
      log_file: this.obj_ut.label
    }, socket_send_msg);
    test.done();
  },

  test_enable_history: function(test) {
    // Fake history
    var test_history = {
      _id: 666,
      log_file: false,
      added_log_files: [],
      add_log_file: function(log_file) {
        this.added_log_files.push(log_file);
      }
    }
    // Test with empty history screen
    this.obj_ut.enable_history(test_history);
    test.deepEqual([this.obj_ut], test_history.added_log_files);
    test.deepEqual({666: test_history}, this.obj_ut.histories);

    // Reset & test with log file already enabled
    test_history.added_log_files = [];
    this.obj_ut.histories = {};
    test_history.log_file = {
      disabled_ids: [],
      disable_history: function(hid) {
        this.disabled_ids.push(hid);
      }
    }
    this.obj_ut.enable_history(test_history);
    test.deepEqual([666], test_history.log_file.disabled_ids);
    test.deepEqual([this.obj_ut], test_history.added_log_files);
    test.deepEqual({666: test_history}, this.obj_ut.histories);
    test.done();
  },

  test_disable_history: function(test) {
    var test_history = {
      _id: 666,
    }
    this.obj_ut.histories = {666: test_history};
    this.obj_ut.disable_history(test_history);
    test.deepEqual({}, this.obj_ut.histories);
    test.done();
  },

  test_view_history: function(test) {
    var test_history = {
      get_log_files: [],
      get_history: function(log_file) {
        this.get_log_files.push(log_file);
      }
    }
    var enable_history_val = false;
    this.obj_ut.enable_history = function(history) {
      enable_history_val = history;
    }
    this.obj_ut.view_history(test_history);
    test.equal(test_history, enable_history_val);
    test.deepEqual([this.obj_ut], test_history.get_log_files);
    test.done();
  },

  test_is_enabled: function(test) {
    this.obj_ut.streams = {'1':1, '2':2, '3':3};
    test.ok(this.obj_ut.is_enabled());
    this.obj_ut.streams = {};
    test.ok(!this.obj_ut.is_enabled());
    test.done();
  },

  test_render: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.render();
    });
    test.done();
  },

  test_ping: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.ping();
    });
    test.done();
  }
});

/* Nodeunit tests for client-side Stream model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var Stream = require('../../lib/client/js/stream.js').Stream;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    // Test WebClient
    this._web_client = {
      streams: {'stream1': 1, 'stream2': 2},
      remove_stream: function(stream) {
        delete this.streams[stream._id];
      }
    };
    this.obj_ut = new Stream(this._web_client);
    this.obj_ut._id = 'stream1';

    // Test LogFiles
    this.test_log_file1 = {
      node: {label: 'node1'},
      label: 'log_file1',
      streams_detached: [],
      detach_stream: function(stream) { this.streams_detached.push(stream); }
    };
    this.test_log_file2 = {
      node: {label: 'node2'},
      label: 'log_file2',
      streams_detached: [],
      detach_stream: function(stream) { this.streams_detached.push(stream); }
    };
    callback();
  },

  test_constructor: function(test) {
    test.equal(null, this.obj_ut._dom);
    test.ok(!this.obj_ut._paused);
    test.deepEqual({}, this.obj_ut.log_files);
    test.equal(null, this.obj_ut.highlight);
    test.equal(0, this.obj_ut.highlight_count);
    test.deepEqual(this._web_client, this.obj_ut.web_client);
    test.equal(3, this.obj_ut.num);
    test.done();
  },

  test_add_log_file: function(test) {
    this.obj_ut.add_log_file(this.test_log_file1);
    test.deepEqual({
      'node1': {
        'log_file1': this.test_log_file1
      }
    },this.obj_ut.log_files);
    this.obj_ut.add_log_file(this.test_log_file2);
    test.deepEqual({
      'node1': {
        'log_file1': this.test_log_file1
      },
      'node2': {
        'log_file2': this.test_log_file2
      }
    },this.obj_ut.log_files);
    test.done();
  },

  test_remove_log_file: function(test) {
    this.obj_ut.add_log_file(this.test_log_file1);
    this.obj_ut.add_log_file(this.test_log_file2);
    this.obj_ut.remove_log_file(this.test_log_file1);
    test.deepEqual({
      'node1': {},
      'node2': {
        'log_file2': this.test_log_file2
      }
    },this.obj_ut.log_files);
    this.obj_ut.remove_log_file(this.test_log_file2);
    test.deepEqual({
      'node1': {},
      'node2': {}
    },this.obj_ut.log_files);
    test.done();
  },

  test_close: function(test) {
    // Test with no log files
    this.obj_ut.close();
    test.deepEqual({'stream2': 2}, this.obj_ut.web_client.streams);

    // Test with multiple log files
    this.obj_ut.web_client.streams['stream1'] = 1;
    this.obj_ut.add_log_file(this.test_log_file1);
    this.obj_ut.add_log_file(this.test_log_file2);
    this.obj_ut.close();

    test.deepEqual({'stream2': 2}, this.obj_ut.web_client.streams);
    test.deepEqual([this.obj_ut], this.test_log_file1.streams_detached);
    test.deepEqual([this.obj_ut], this.test_log_file2.streams_detached);
    test.done();
  },

  test_get_label: function(test) {
    var label = this.obj_ut.get_label();
    test.equal('Stream 3', label);
    test.done();
  },

  test_add_highlight: function(test) {
    var fake_regex = "regex_yo";
    this.obj_ut.add_highlight(fake_regex);
    test.equal(fake_regex, this.obj_ut.highlight);
    test.done();
  },

  test_remove_highlight: function(test) {
    this.obj_ut.remove_highlight();
    test.equal(null, this.obj_ut.highlight);
    test.equal(0, this.obj_ut.highlight_count);
    test.done();
  },

  test_pause: function(test) {
    this.obj_ut._paused = false;
    this.obj_ut.pause();
    test.ok(this.obj_ut._paused);
    this.obj_ut.pause();
    test.ok(this.obj_ut._paused);
    test.done();
  },

  test_start: function(test) {
    this.obj_ut._paused = true;
    this.obj_ut.start();
    test.ok(!this.obj_ut._paused);
    this.obj_ut.start();
    test.ok(!this.obj_ut._paused);
    test.done();
  },

  test_render: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.render();
    });
    test.done();
  },

  test_destroy: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.destroy();
    });
    test.done();
  },

  test_log: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.log();
    });
    test.done();
  }
});

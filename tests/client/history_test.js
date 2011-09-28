/* Nodeunit tests for client-side History model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var History = require('../../lib/client/js/history.js').History;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    // Test WebClient
    this._web_client = {
      histories: {'history1': 1, 'history2': 2},
      remove_history: function(history) {
        delete this.histories[history._id];
      },
      socket: {
        sent_messages: [],
        emit: function(event, msg) {
          this.sent_messages.push([event, msg]);
        }
      }
    };
    this.obj_ut = new History(this._web_client);
    this.obj_ut._id = 'history1';

    // Test LogFile
    this.test_log_file = {
      node: {label: 'node1'},
      label: 'log_file1'
    };

    callback();
  },

  test_constructor: function(test) {
    test.equal(null, this.obj_ut._dom);
    test.equal(null, this.obj_ut.log_file);
    test.equal(null, this.obj_ut.highlight);
    test.equal(0, this.obj_ut.highlight_count);
    test.deepEqual(this._web_client, this.obj_ut.web_client);
    test.equal(3, this.obj_ut.num);
    test.done();
  },

  test_get_history: function(test) {
    this.obj_ut.get_history(this.test_log_file);
    test.deepEqual([['history_request', {
      node: this.test_log_file.node.label,
      log_file: this.test_log_file.label,
      history_id: this.obj_ut._id
    }]], this.obj_ut.web_client.socket.sent_messages);
    test.done();
  },

  test_add_log_file: function(test) {
    this.obj_ut.add_log_file(this.test_log_file);
    test.deepEqual(this.test_log_file, this.obj_ut.log_file);
    test.done();
  },

  test_close: function(test) {
    // Test with no log files
    this.obj_ut.close();
    test.deepEqual({'history2': 2}, this.obj_ut.web_client.histories);
    test.done();
  },

  test_get_label: function(test) {
    // Test without active LogFile
    var label = this.obj_ut.get_label();
    test.equal("History 3", label);

    // Test with active LogFile
    this.obj_ut.add_log_file(this.test_log_file);
    var label = this.obj_ut.get_label();
    test.equal("History 3 - node1:log_file1", label);
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

  test_add_lines: function(test) {
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.add_lines();
    });
    test.done();
  }
});

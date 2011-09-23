/* Nodeunit tests for LogServer's WebClient model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var WebClient = require('../../lib/server/web_client.js').WebClient;
var testCase = require('nodeunit').testCase;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this.test_client = {
      sent_messages: [],
      emit: function(event, msg) {
        this.sent_messages.push([event, msg]);
      },
      events: {},
      on: function(event, callback) {
        this.events[event] = callback;
      },
      join: function(room) {
        this.joined_room = room;
      },
      leave: function(room) {
        this.left_room = room;
      },
      trigger_event: function(event, data) {
        this.events[event](data);
      }
    };
    this.test_log_file = {
      node: {label: 'node1'},
      label: 'log_file1',
      added_web_clients: [],
      add_web_client: function(wc) {
        this.added_web_clients.push(wc);
      },
      removed_web_clients: [],
      remove_web_client: function(wc) {
        this.removed_web_clients.push(wc);
      },
      requested_histories: [],
      request_history: function(client, history_id) {
        this.requested_histories.push([client, history_id]);
      }
    };
    this.test_server = {
      nodes: {
        'node1': {
          label: 'node1',
          log_files: {
            'log_file1': this.test_log_file
          }
        }
      }
    };
    this.obj_ut = new WebClient(this.test_client, this.test_server);
    callback();
  },

  test_constructor: function(test) {
    test.deepEqual(this.test_server, this.obj_ut.log_server);
    test.deepEqual(this.test_client, this.obj_ut.socket);
    test.deepEqual([], this.obj_ut.watching_logs);
    test.equal('web_clients', this.test_client.joined_room);
    test.done();
  },

  test_enable_log_message: function(test) {
    var client_message = {
      node: this.test_log_file.node.label,
      log_file: this.test_log_file.label
    }
    this.test_client.trigger_event('enable_log', client_message);
    test.deepEqual([this.obj_ut], this.test_log_file.added_web_clients);
    test.deepEqual([this.test_log_file], this.obj_ut.watching_logs);
    test.done();
  },

  test_disable_log_message: function(test) {
    var client_message = {
      node: this.test_log_file.node.label,
      log_file: this.test_log_file.label
    };
    this.obj_ut.watching_logs = [this.test_log_file];
    this.test_client.trigger_event('disable_log', client_message);
    test.deepEqual([this.obj_ut], this.test_log_file.removed_web_clients);
    test.deepEqual([], this.obj_ut.watching_logs);
    test.done();
  },

  test_history_request: function(test) {
    var client_message = {
      node: this.test_log_file.node.label,
      log_file: this.test_log_file.label,
      history_id: 666
    };
    this.test_client.trigger_event('history_request', client_message);
    test.deepEqual([[this.obj_ut, 666]],
      this.test_log_file.requested_histories);
    test.done();
  },

  test_disconnect: function(test) {
    this.obj_ut.watching_logs = [this.test_log_file];
    this.test_client.trigger_event('disconnect');
    test.deepEqual([this.obj_ut], this.test_log_file.removed_web_clients);
    test.equal('web_clients', this.test_client.left_room);
    test.done();
  },

  test_get_log_file: function(test) {
    var log_file = this.obj_ut.get_log_file('node1', 'log_file1');
    test.deepEqual(this.test_log_file, log_file);
    test.done();
  },

  test_add_node: function(test) {
    this.obj_ut.add_node(this.test_server.nodes['node1']);
    test.deepEqual([['add_node', {
      node: 'node1',
      logs: ['log_file1']
    }]], this.test_client.sent_messages);
    test.done();
  },

  test_remove_node: function(test) {
    this.obj_ut.remove_node(this.test_server.nodes['node1']);
    test.deepEqual([['remove_node', {
      node: 'node1'
    }]], this.test_client.sent_messages);
    test.done();
  }
});

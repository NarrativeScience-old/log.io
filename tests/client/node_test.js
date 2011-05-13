/* Nodeunit tests for client-side Node model
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var lf = require('../../lib/client/js/log_file.js');
var Node = require('../../lib/client/js/node.js').Node;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this._label = 'node1';
    this._logs = ['log1','log2'];
    this._web_client = {foo: 'bar'};

    // Stub out LogFile
    lf.LogFile = function(label, node) {
        this.label = label;
        this.node = node;
    }
    this.obj_ut = new Node(this._label, this._logs, this._web_client);
    callback();
  },

  test_constructor: function(test) {
    test.equal(this._label, this.obj_ut.label);
    test.deepEqual(this._web_client, this.obj_ut.web_client);
    test.deepEqual({
      'log1': new lf.LogFile(this.obj_ut, 'log1'),
      'log2': new lf.LogFile(this.obj_ut, 'log2')
    }, this.obj_ut.log_files);
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
  }
});

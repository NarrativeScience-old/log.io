/* Nodeunit tests for client-side ColorManager
 * https://github.com/caolan/nodeunit
 */

// Imports
var __ = require('underscore');
var testCase = require('nodeunit').testCase;
var ColorManager = require('../../lib/client/js/color_manager.js').ColorManager;

// Unit Tests
module.exports = testCase({

  setUp: function(callback) {
    this.obj_ut = new ColorManager();
    callback();
  },

  test_constructor: function(test) {
    test.deepEqual([10,9,8,7,6,5,4,3,2,1], this.obj_ut.available);
    test.done();
  },

  test_next: function(test) {
    var next_color = this.obj_ut.next();
    test.equal(1, next_color);
    test.deepEqual([10,9,8,7,6,5,4,3,2], this.obj_ut.available);
    next_color = this.obj_ut.next();
    test.deepEqual([10,9,8,7,6,5,4,3], this.obj_ut.available);
    test.equal(2, next_color);

    this.obj_ut.available = [];
    var obj_ut = this.obj_ut;
    test.throws(function() {
      obj_ut.next();
    });
    test.done();
  },

  test_release: function(test) {
    var color = this.obj_ut.next();
    this.obj_ut.release(color);
    test.deepEqual([10,9,8,7,6,5,4,3,2,1], this.obj_ut.available);
    var color = this.obj_ut.next();
    this.obj_ut.release("1");
    test.deepEqual([10,9,8,7,6,5,4,3,2,1], this.obj_ut.available);
    test.done();
  }
});

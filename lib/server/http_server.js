/* Base HTTP Server, optionally with HTTP basic auth
 * Used by log server to bind Socket.io, serve base static content
 */

var connect = require('connect'),
    sys = require(process.binding('natives').util ? 'util' : 'sys');

// Import usage:
// var h = require('./http_server.js');
// var http_server = h.HTTPServer().listen(8899);
// var http_auth_server = h.HTTPAuthServer("foo","bar").listen(8899);
module.exports = {
  HTTPServer: function() {
    return connect.createServer(
      connect.static(__dirname + '/../client')
    );
  },
  HTTPAuthServer: function(user, pass) {
    return connect.createServer(
      connect.basicAuth(user, pass),
      connect.static(__dirname + '/../client')
    );
  }
}

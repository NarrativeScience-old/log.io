var e = console.log;

try {
  e("Checking for node.js package 'socket.io'...");
  var io = require('socket.io');
} catch (err) {
  e("ERROR: Could not find socket.io package");
  e("npm install socket.io");
  e("... or ...");
  e("https://github.com/LearnBoost/Socket.IO-node.git");
  process.exit(1);
}

try {
  e("Checking for node.js package 'underscore'...");
  var __ = require('underscore');
} catch (err) {
  e("ERROR: Could not find underscore package");
  e("npm install underscore");
  e("... or ...");
  e("https://github.com/documentcloud/underscore/");
  process.exit(1);
}

try {
  e("Checking for node.js package 'connect'...");
  var http_digest = require('connect');
} catch (err) {
  e("ERROR: Could not find connect package");
  e("npm install connect");
  e("... or ...");
  e("https://github.com/senchalabs/connect");
  process.exit(1);
}

try {
  e("Checking for node.js package 'Socket.io-node-client'...");
  var client_io = require('socket.io.client/io-client.js').io;
} catch (err) {
  e("ERROR: Could not find socket.io-client package");
  e("https://github.com/remy/Socket.io-node-client");
  e("");
  e("NOTE: This one is tricky since there's no npm package.");
  e("Drop repo into /usr/local/lib/node/socket.io.client/");
  e("Be sure to recursively clone the repo:");
  e("git submodule update --init --recursive");
  e("");
  e("Ultimately you should end up with:");
  e("/usr/local/lib/node/socket.io.client/io-client.js");
  e("/usr/local/lib/node/socket.io.client/socket.io-node/");
  e("/usr/local/lib/node/socket.io.client/socket.io-node/lib/socket.io/utils");
  e("/usr/local/lib/node/socket.io.client/socket.io-node/support/node-websocket-client/lib/websocket");
  process.exit(1);
}

e("Success! Now run the install script in ./install/*");

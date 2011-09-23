var e = console.log;

try {
  e("Checking for node.js package 'socket.io'...");
  var io = require('socket.io');
  var version = io.version;
  if (version.indexOf("0.8") >= 0) {
    e("ERROR: Log.io is incompatible with pre-0.8.x versions of socket.io");
    process.exit(1);
  }
} catch (err) {
  e("ERROR: Could not find socket.io package");
  e("sudo npm install -g socket.io");
  e("... or ...");
  e("https://github.com/LearnBoost/socket.io/");
  process.exit(1);
}

try {
  e("Checking for node.js package 'socket.io-client'...");
  var io = require('socket.io-client');
} catch (err) {
  e("ERROR: Could not find socket.io-client package");
  e("sudo npm install -g socket.io-client");
  e("... or ...");
  e("https://github.com/LearnBoost/socket.io-client/");
  process.exit(1);
}

try {
  e("Checking for node.js package 'underscore'...");
  var __ = require('underscore');
} catch (err) {
  e("ERROR: Could not find underscore package");
  e("sudo npm install -g underscore");
  e("... or ...");
  e("https://github.com/documentcloud/underscore/");
  process.exit(1);
}

try {
  e("Checking for node.js package 'connect'...");
  var http_digest = require('connect');
} catch (err) {
  e("ERROR: Could not find connect package");
  e("sudo npm install -g connect");
  e("... or ...");
  e("https://github.com/senchalabs/connect");
  process.exit(1);
}

e("Success! Now run the install script in ./install/*");
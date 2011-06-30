var e = console.log;

try {
  e("Checking for node.js package 'socket.io'...");
  var io = require('socket.io');
  var version = io.version;
  if (version.indexOf("0.7") >= 0) {
    e("ERROR: Log.io is currently incompatible with socket.io v0.7");
    e("Be sure to use v0.6.17");
    e("");
    e("sudo npm install -g socket.io@0.6.17");
    e("... or ...");
    e("https://github.com/LearnBoost/socket.io/tree/0.6.17");
    process.exit(1);
  }
} catch (err) {
  e("ERROR: Could not find socket.io package");
  e("sudo npm install -g socket.io@0.6.17");
  e("... or ...");
  e("https://github.com/LearnBoost/socket.io/tree/0.6.17");
  e("");
  e("WARNING: Log.io is currently incompatible with socket.io v0.7");
  e("Be sure to use v0.6.17");
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

try {
  e("Checking for node.js package 'Socket.io-node-client (msmathers)'...");
  var client_io = require('Socket.io-node-client/io-client.js').io;
} catch (err) {
  e("ERROR: Could not find Socket.io-node-client (msmathers) package");
  e("https://github.com/msmathers/Socket.io-node-client");
  e("");
  e("NOTE: This one is tricky since there's no npm package, as well as");
  e("a git tag checkout to downgrade its socket.io dependency.");
  e("This is a temporary workaround until socket.io-client v0.7 works");
  e("outside a browser context.");
  e("");
  e("# Install:");
  e("cd /usr/local/lib/node_modules/");
  e("sudo git clone git://github.com/msmathers/Socket.io-node-client.git");
  e("cd Socket.io-node-client");
  e("sudo git submodule update --init --recursive");
  e("cd socket.io-node");
  e("sudo git checkout 0.6.17");
  process.exit(1);
}

e("Success! Now run the install script in ./install/*");
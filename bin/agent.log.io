#!/usr/bin/env node

// https://github.com/visionmedia/commander.js
// args
var program = require('commander');

program
  .version('0.2.7')
  .option('-c, --config [file]', 'Configuration')
  .option('-s, --server', 'Server mode')
  .parse(process.argv);

if (!program.config) {
  program.config = '/etc/log.io/harvester.conf';
  if(program.server)
    program.config = '/etc/log.io/server.conf';
}


// main
var logio  = require('log.io');
var config = require(program.config).config;

// log.io server
if(program.server) {
  if (config.basic_auth) {
    var user = config.basic_auth.username;
    var pass = config.basic_auth.password;
    var HTTPServer = logio.http.HTTPAuthServer(user, pass);
  } else {
    var HTTPServer = logio.http.HTTPServer();
  }

  var server = new logio.Server(HTTPServer);
  server.listen(config.port,config.host);
}

// log.io harvester
else {
  if (process.env.LOGIO_HARVESTER_INSTANCE_NAME && !config.instance_name) {
    config.instance_name = process.env.LOGIO_HARVESTER_INSTANCE_NAME;
  } else if (!config.instance_name) {
    console.log("ERROR: Unable to determine harvester instance name.");
    console.log("Either set 'instance_name' in /etc/log.io/harvester.conf,");
    console.log("or defined LOGIO_HARVESTER_INSTANCE_NAME in your environment.");
    process.exit(1);
  }

  var harvester = new logio.Harvester(config);
  harvester.run();
}

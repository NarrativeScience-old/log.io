#!/usr/bin/env node
winston = require('winston');
logging = new winston.Logger({
  transports: [ new winston.transports.Console({
    level: 'error'
  })]
});
homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
conf = require(homeDir + '/.log.io/harvester.conf').config;
conf.logging = logging;
harvester = require('../index.js');
harvester = new harvester.LogHarvester(conf);
harvester.run();

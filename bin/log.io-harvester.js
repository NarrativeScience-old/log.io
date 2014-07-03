#!/usr/bin/env node
/*global require: true */

(function () {
	'use strict';

	var winston = require('winston'),
		homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
		conf = require(homeDir + '/.log.io/harvester.conf').config,
		Harvester = require('../index.js'),
		harvester;

	conf.logging = new winston.Logger({
		transports: [
			new winston.transports.Console({
				level: 'debug'
			}),
		]
	});
	harvester = new Harvester.LogHarvester(conf);
	harvester.run();
}());

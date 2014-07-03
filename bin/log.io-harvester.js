#!/usr/bin/env node
/*global require: true */

(function () {
	'use strict';

	var winston = require('winston'),
		logger = new winston.Logger({
			transports: [
				new winston.transports.Console({
					level: 'debug',
				}),
			],
		}),
		home_dir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
		conf = require(home_dir + '/.log.io/harvester.conf').config,
		Harvester = require('../index.js'),
		harvester;

	conf.logging = logger;
	harvester = new Harvester.LogHarvester(conf);
	harvester.run();
}());

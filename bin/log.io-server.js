#!/usr/bin/env node
/*global require: true */

(function () {
	'use strict';

	var winston = require('winston'),
		logger = new winston.Logger({
			transports: [
				new winston.transports.Console({
					level: 'error',
				}),
			],
		}),
		home_dir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
		webConf = require(home_dir + '/.log.io/web_server.conf').config,
		logConf = require(home_dir + '/.log.io/log_server.conf').config,
		server = require('../index.js'),
		logServer,
		webServer;
	
	webConf.logging = logger;
	logConf.logging = logger;
	logServer = new server.LogServer(logConf);
	webServer = new server.WebServer(logServer, webConf);
	webServer.run();
}());

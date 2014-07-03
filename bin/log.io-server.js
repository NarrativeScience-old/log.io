#!/usr/bin/env node
/*global require: true */

(function () {
	'use strict';

	var winston = require('winston'),
		logging = new winston.Logger({
			transports: [
				new winston.transports.Console({
					level: 'error',
				}),
			],
		}),
		homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'],
		webConf = require(homeDir + '/.log.io/web_server.conf').config,
		logConf = require(homeDir + '/.log.io/log_server.conf').config,
		server = require('../index.js'),
		logServer,
		webServer;
	
	webConf.logging = logging;
	logConf.logging = logging;
	logServer = new server.LogServer(logConf);
	webServer = new server.WebServer(logServer, webConf);
	webServer.run();
}());

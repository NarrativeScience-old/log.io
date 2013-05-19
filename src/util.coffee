### Log.io Util


###

winston = require 'winston'

exports.logger = (level = "info") ->
  new winston.Logger
    levels:
      debug: 0
      info: 1
      warn: 2
      error: 3
    transports: [new winston.transports.Console
      level: level,
      colorize: true,
      timestamp: true]

{LogHarvester} = require './harvester.js'
winston = require 'winston'
fs = require 'fs'
mkdirp = require 'mkdirp'
logger = new winston.Logger
  transports: [ new winston.transports.Console]

TEST_FILES = [
  "#{__dirname}/tmp/stream1a.log",
  "#{__dirname}/tmp/stream1b.log",
  "#{__dirname}/tmp/stream2a.log",
  "#{__dirname}/tmp/stream2b.log",
  "#{__dirname}/tmp/stream3a.log",
  "#{__dirname}/tmp/stream3b.log",
  "#{__dirname}/tmp/stream4a.log",
  "#{__dirname}/tmp/stream4b.log",
]

HARVESTER1_CONFIG =
  logging: logger
  nodeName: 'server01'
  logStreams:
    stream1: TEST_FILES[0..1]
    stream2: TEST_FILES[2..3]
  server:
    host: 'localhost'
    port: 28771

logger.info "Creating test diretory: #{__dirname}/tmp"
mkdirp "#{__dirname}/tmp", ->
  for fpath in TEST_FILES
    logger.info "Creating test log file: #{fpath}"
    fs.writeFile fpath, ''

exports.testFileWatch = (test) ->
  harvester1 = new LogHarvester HARVESTER1_CONFIG
  harvester1.run()
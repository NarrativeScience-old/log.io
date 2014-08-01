### Log.io Functional tests
#
# Stands up all 3 components, verifies that writing to a file
# ends up populating a client collection.
#
# TODO(msmathers): Write more complete test coverage.
###

fs = require 'fs'
chai = require 'chai'
_ = require 'underscore'
winston = require 'winston'
sinon_chai = require 'sinon-chai'
chai.use sinon_chai
should = chai.should()

{LogHarvester} = require '../../lib/harvester.js'
{LogServer, WebServer} = require '../../lib/server.js'
{WebClient} = require '../../lib/client.js'
logging = new winston.Logger
  transports: [ new winston.transports.Console level: 'error']

# Configuration

TEST_FILES = [
  '/tmp/stream1a.log',
  '/tmp/stream1b.log',
  '/tmp/stream2a.log',
  '/tmp/stream2b.log',
  '/tmp/stream3a.log',
  '/tmp/stream3b.log',
  '/tmp/stream4a.log',
  '/tmp/stream4b.log'
]

HARVESTER1_CONFIG =
  logging: logging
  nodeName: 'server01'
  logStreams:
    stream1: TEST_FILES[0..1]
    stream2: TEST_FILES[2..3]
  server:
    host: '0.0.0.0'
    port: 28771

HARVESTER2_CONFIG =
  logging: logging
  nodeName: 'server02'
  logStreams:
    stream2: TEST_FILES[4..5]
    stream3: TEST_FILES[6..7]
  server:
    host: '0.0.0.0'
    port: 28771

LOG_SERVER_CONFIG =
  logging: logging
  port: 28771
WEB_SERVER_CONFIG =
  logging: logging
  port: 28772

# Drop empty test files

fs.writeFile fpath, '' for fpath in TEST_FILES

# Initialize servers

logServer = new LogServer LOG_SERVER_CONFIG
webServer = new WebServer logServer, WEB_SERVER_CONFIG
webServer.run()

describe 'LogServer', ->
  it 'should have no nodes or streams initially', ->
    _.keys(logServer.logNodes).should.have.length 0
    _.keys(logServer.logStreams).should.have.length 0

    # Connect harvesters
    harvester1 = new LogHarvester HARVESTER1_CONFIG
    harvester2 = new LogHarvester HARVESTER2_CONFIG
    harvester1.run()
    harvester2.run()

    describe 'Log Server registration', ->
      it 'should have registered nodes & streams once connected', ->
        logServer.logNodes.should.have.keys 'server01', 'server02'
        logServer.logStreams.should.have.keys 'stream1', 'stream2', 'stream3'

# Initialize client

webClient = new WebClient host: 'http://0.0.0.0:28772'

# Write to watched files, verify end-to-end propagation

describe 'WebClient', ->
  it 'waits for server connection...', (connected) ->
    webClient.socket.on 'initialized', ->

      describe 'WebClient state', ->
        it 'should be notified of registered nodes & streams', ->
          webClient.logNodes.should.have.length 2
          webClient.logStreams.should.have.length 3

        it 'creates a log screen and actives a node/stream pair', ->
          screen1 = webClient.createScreen 'Screen 1'
          stream1 = webClient.logStreams.get 'stream1'
          node1 = webClient.logNodes.get 'server01'
          screen1.addPair stream1, node1
          screen1.logMessages.should.have.length 0

          describe 'log message propagation', ->
            it 'should populate client backbone collection on file writes', (done) ->
              msg1 = "log message 1"
              msg2 = "log message 2"
              # This file is a member of the watched stream
              fs.appendFileSync TEST_FILES[0], "#{msg1}\n"
              # This file is not a member of the watched stream
              fs.appendFileSync TEST_FILES[2], "#{msg2}\n"
              webClient.socket.once 'new_log', ->
                screen1.logMessages.should.have.length 1
                screen1.logMessages.at(0).get('message').should.equal msg1
                done()

      connected()

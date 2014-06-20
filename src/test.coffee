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
  logStreams:
    stream1: TEST_FILES[0..1]
    stream2: TEST_FILES[2..3]
  server:
    host: 'localhost'
    port: 28771

###
TODO Harvester Tests:

Single file:
 + File did not exist, then created
 should add a file

 + File modification
 creates new log

 + File renamed
 renamed file is unwatched, wait for new file with old filename

 + File deleted
 wait for new file

 + File deleted and then added
 add new file

Directory:
 - Directory did not exist, then created
 - Directory renamed
 - Directory deleted
 - File added to directory
 - File renamed in directory
 - File removed from directory

Server:
 - Server went up
 should reconnect

 - Server went down
 should retry until server is up

Bugs:
 - There used to be a bug where harvester was using a lot of CPU while could not connect to server.
###

logger.info "Creating test directory: #{__dirname}/tmp"
fs.mkdirSync "#{__dirname}/tmp" if not fs.existsSync "#{__dirname}/tmp"
for fpath in TEST_FILES[0..3]
  logger.info "Deleting test log file: #{fpath}"
  fs.unlinkSync fpath if fs.existsSync fpath
for fpath in TEST_FILES[0..2]
  logger.info "Creating test log file: #{fpath}"
  fs.writeFileSync fpath, ''

harvester1 = new LogHarvester HARVESTER1_CONFIG
currently_watched_files = []
harvester1.on 'file_watching', (path, online) ->
  if online
    currently_watched_files.push path if (currently_watched_files.indexOf path) < 0
  else
    currently_watched_files.splice (currently_watched_files.indexOf path), 1 if (currently_watched_files.indexOf path) >= 0
generated_logs = []
harvester1.on 'log_new', (stream, msg) ->
  generated_logs.push msg
harvester1.run()

exports.testFileWatch =

  'files are watched': (test) ->
    setTimeout (->
      test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0
      test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0
      test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0
      test.ok currently_watched_files.length is 3
      test.done()
    ), 200

  'files are unwatched when deleted': (test) ->
    fs.unlinkSync TEST_FILES[2]
    setTimeout (->
      test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0
      test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0
      test.ok currently_watched_files.length is 2
      test.done()
    ), 200

  'files are added when created': (test) ->
    for fpath in TEST_FILES[2..3]
      logger.info "Creating test log file: #{fpath}"
      fs.writeFileSync fpath, ''

    setTimeout (->
      test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0, 'TEST_FILES[0]'
      test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0, 'TEST_FILES[1]'
      test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0, 'TEST_FILES[2]'
      test.ok (currently_watched_files.indexOf TEST_FILES[3]) >= 0, 'TEST_FILES[3]'
      test.ok currently_watched_files.length is 4
      test.done()
    ), 1500

  'files are unwatched when renamed': (test) ->
    fs.renameSync TEST_FILES[1], "#{__dirname}/tmp/renamed.log"

    setTimeout (->
      test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0, 'TEST_FILES[0]'
      test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0, 'TEST_FILES[2]'
      test.ok (currently_watched_files.indexOf TEST_FILES[3]) >= 0, 'TEST_FILES[3]'
      test.ok currently_watched_files.length is 3
      test.done()
    ), 1500

  'files are unwatched when renamed': (test) ->
    fs.writeFileSync "#{__dirname}/tmp/newfile.log", ''
    fs.renameSync "#{__dirname}/tmp/newfile.log", TEST_FILES[1]

    setTimeout (->
      test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0, 'TEST_FILES[0]'
      test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0, 'TEST_FILES[1]'
      test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0, 'TEST_FILES[2]'
      test.ok (currently_watched_files.indexOf TEST_FILES[3]) >= 0, 'TEST_FILES[3]'
      test.ok currently_watched_files.length is 4
      test.done()
    ), 1500

  'files are watched correctly': (test) ->
    fs.appendFileSync TEST_FILES[0], 'test log0'
    fs.appendFileSync TEST_FILES[1], 'test log1'
    fs.appendFileSync TEST_FILES[2], 'test log2'
    fs.appendFileSync TEST_FILES[3], 'test log3'
    fs.appendFileSync "#{__dirname}/tmp/renamed.log", 'renamed'

    setTimeout (->
      test.ok (generated_logs.indexOf 'test log0') >= 0
      test.ok (generated_logs.indexOf 'test log1') >= 0
      test.ok (generated_logs.indexOf 'test log2') >= 0
      test.ok (generated_logs.indexOf 'test log3') >= 0
      test.ok currently_watched_files.length is 4
      test.done()

      harvester1.stop();
    ), 500

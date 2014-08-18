{LogHarvester} = require './harvester.js'
winston = require 'winston'
fs = require 'fs'
mkdirp = require 'mkdirp'
logger = new winston.Logger
	transports: [new winston.transports.Console]

TEST_FILES = [
	"#{__dirname}/tmp/stream1a.log",
	"#{__dirname}/tmp/stream1b.log",
	"#{__dirname}/tmp/stream2a.log",
	"#{__dirname}/tmp/stream2b.log",
	"#{__dirname}/tmp/renamed.log",
]

TEST_DIRS = [
	"#{__dirname}/tmp2",
]

HARVESTER1_CONFIG =
	logging: logger
	logStreams:
		stream1: TEST_FILES[0..1]
		stream2: TEST_FILES[2..3]
		stream3: [
			TEST_DIRS[0]
		]
	server:
		host: 'localhost'
		port: 28771

###
TODO Harveter Tests:

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
 + Directory did not exist, then created
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
	'verifying right files are watched': (test) ->
		logger.info "Creating test diretory: #{__dirname}/tmp"
		fs.mkdirSync "#{__dirname}/tmp" if not fs.existsSync "#{__dirname}/tmp"
		fs.writeFileSync fpath, '' for fpath in TEST_FILES[0..2]
		setTimeout (->
			test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0
			test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0
			test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0
			test.ok currently_watched_files.length is 3
			test.done()
		), 2000

	'checking file deletion': (test) ->
		fs.unlinkSync TEST_FILES[2]
		setTimeout (->
			test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0
			test.ok (currently_watched_files.indexOf TEST_FILES[1]) >= 0
			test.ok currently_watched_files.length is 2
			test.done()
		), 200

	'checking file addition': (test) ->
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

	'checking file rename 1': (test) ->
		fs.renameSync TEST_FILES[1], TEST_FILES[4]
		setTimeout (->
			test.ok (currently_watched_files.indexOf TEST_FILES[0]) >= 0, 'TEST_FILES[0]'
			test.ok (currently_watched_files.indexOf TEST_FILES[2]) >= 0, 'TEST_FILES[2]'
			test.ok (currently_watched_files.indexOf TEST_FILES[3]) >= 0, 'TEST_FILES[3]'
			test.ok currently_watched_files.length is 3
			test.done()
		), 1500

	'checking file rename 2': (test) ->
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

	'checking log adding 1': (test) ->
		fs.appendFileSync TEST_FILES[0], 'test log0'
		fs.appendFileSync TEST_FILES[1], 'test log1'
		fs.appendFileSync TEST_FILES[2], 'test log2'
		fs.appendFileSync TEST_FILES[3], 'test log3'
		fs.appendFileSync TEST_FILES[4], 'renamed'
		setTimeout (->
			test.ok (generated_logs.indexOf 'test log0') >= 0
			test.ok (generated_logs.indexOf 'test log1') >= 0
			test.ok (generated_logs.indexOf 'test log2') >= 0
			test.ok (generated_logs.indexOf 'test log3') >= 0
			test.ok (generated_logs.indexOf 'renamed') == -1
			test.ok currently_watched_files.length is 4
			test.done()
		), 2000

	'checking all file deletion': (test) ->
		fs.unlinkSync TEST_FILES[0]
		fs.unlinkSync TEST_FILES[1]
		fs.unlinkSync TEST_FILES[2]
		fs.unlinkSync TEST_FILES[3]
		fs.unlinkSync TEST_FILES[4]
		setTimeout (->
			test.ok currently_watched_files.length is 0
			test.done()
			fs.rmdirSync "#{__dirname}/tmp"
		), 400

exports.testDirectoryWatch =
	'no directory': (test) ->
		setTimeout (->
			test.ok currently_watched_files.length == 0
			test.done()
		), 100

	'created directory': (test) ->
		fs.mkdirSync TEST_DIRS[0]
		setTimeout (->
			test.ok currently_watched_files.length == 0
			test.done()
		), 100

	'added a file to new directory': (test) ->
		fs.writeFileSync (TEST_DIRS[0] + '/test.log'), 'a'
		setTimeout (->
			test.ok currently_watched_files.length == 1
			test.done()
			harvester1.stop()
			fs.unlinkSync "#{TEST_DIRS[0]}/test.log"
			fs.rmdirSync TEST_DIRS[0]
		), 2000

  ######## @TODO Below is failing tests and needs to be fixed ########
	# 'moved watched directory away': (test) ->
	# 	fs.renameSync TEST_DIRS[0], "#{TEST_DIRS[0]}_moved"
	# 	setTimeout (->
	# 		test.ok currently_watched_files.length == 0
	# 		test.done()
	# 		harvester1.stop()
	# 	), 2000

	# 'moved watched directory back': (test) ->
	# 	fs.renameSync "#{TEST_DIRS[0]}_moved", TEST_DIRS[0]
	# 	setTimeout (->
	# 		test.ok currently_watched_files.length == 1
	# 		test.done()
	# 		fs.unlinkSync "#{TEST_DIRS[0]}/test.log"
	# 		fs.rmdirSync TEST_DIRS[0]
	# 		harvester1.stop()
	# 	), 2000

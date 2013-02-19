{spawn, exec} = require 'child_process'
fs = require 'fs'

ENV = '/usr/bin/env'
BROWSERIFY = "#{ ENV } browserify"
COFFEE = "#{ ENV } coffee"
LESS = "#{ ENV } lessc"

TEMPLATE_SRC = "#{ __dirname }/templates"
TEMPLATE_OUTPUT = "#{ __dirname }/src/templates.coffee"

task 'build', "Builds Log.io package", ->
  invoke 'templates'
  invoke 'less'
  invoke 'compile'
  invoke 'browserify'

task 'compile', "Compiles CoffeeScript src/*.coffee to lib/*.js", ->
  console.log "Compiling src/*.coffee to lib/*.js"
  exec "#{COFFEE} --compile --output #{__dirname}/lib/ #{__dirname}/src/", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr if stdout + stderr

task 'browserify', "Compiles client.coffee to browser-friendly JS", ->
  console.log "Browserifying src/client.coffee to lib/log.io.js"
  exec "#{BROWSERIFY} src/client.coffee --exports process,require -o #{ __dirname }/lib/log.io.js", (err, stdout, stderr) ->
    console.log stdout + stderr if err

task 'less', "Compiles less templates to CSS", ->
  console.log "Compiling src/less/* to lib/log.io.css"
  exec "#{LESS} #{__dirname}/src/less/log.io.less -compress -o #{__dirname}/lib/log.io.css", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr if stdout + stderr

task 'templates', "Compiles templates/*.html to src/templates.coffee", ->
  console.log "Generating src/templates.coffee from templates/*.html"
  buildTemplate()

task 'ensure:configuration', "Ensures that config files exist in ~/.log.io/", ->
  homedir = process.env[if process.platform is 'win32' then 'USERPROFILE' else 'HOME']
  ldir = homedir + '/.log.io/'
  fs.mkdir ldir if not fs.existsSync ldir
  for c in ['harvester', 'log_server', 'web_server']
    path = ldir + "#{c}.conf"
    copyFile "./conf/#{c}.conf", path if not fs.existsSync path

copyFile = (from, to) ->
  fs.createReadStream(from).pipe fs.createWriteStream to

exportify = (f) ->
  templateName = f.replace '.html', ''
  templateExportName = templateName.replace '-', '.'
  templateFilePath = "#{ TEMPLATE_SRC }/#{ f }"
  body = fs.readFileSync templateFilePath, 'utf-8'
  content = "exports.#{ templateExportName } = \"\"\"#{ body }\"\"\""

buildTemplate = ->
  files = fs.readdirSync TEMPLATE_SRC
  templateBlocks = (exportify f for f in files)
  content = '# TEMPLATES.COFFEE IS AUTO-GENERATED. CHANGES WILL BE LOST!\n'
  content += templateBlocks.join '\n\n'
  fs.writeFileSync TEMPLATE_OUTPUT, content, 'utf-8'

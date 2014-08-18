{spawn, exec} = require 'child_process'
fs = require 'fs'

ENV = '/usr/bin/env'
COFFEE = "#{ENV} coffee"
MOCHA = "#{ENV} mocha"
LESS = "#{ENV} lessc"
BROWSERIFY = "#{ENV} browserify"
YUIDOC = "#{ENV} yuidoc"

TEMPLATE_SRC = "#{__dirname}/templates"
TEMPLATE_OUTPUT = "#{__dirname}/src/templates.coffee"

# Main build task
task 'build', 'Builds Log.io package', ->
  invoke 'templates'
  invoke 'compile'
  invoke 'styles'
  invoke 'browserify'

# Building templates
decorateTemplateForExports = (f) ->
  templateName = f.replace '.html', ''
  templateExportName = templateName.replace '-', '.'
  templateFilePath = "#{TEMPLATE_SRC}/#{f}"
  body = fs.readFileSync templateFilePath, 'utf-8'
  content = "exports.#{templateExportName} = \"\"\"#{body}\"\"\""

task 'templates', 'Compiles templates/*.html to src/templates.coffee', ->
  console.log 'Generating src/templates.coffee from templates/*.html'
  files = fs.readdirSync TEMPLATE_SRC
  templateBlocks = (decorateTemplateForExports f for f in files)
  content = '# TEMPLATES.COFFEE IS AUTO-GENERATED. CHANGES WILL BE LOST!\n'
  content += templateBlocks.join '\n\n'
  fs.writeFileSync TEMPLATE_OUTPUT, content, 'utf-8'

# Building javascripts
task 'compile', 'Compiles CoffeeScript src/*.coffee to lib/*.js', ->
  console.log "Compiling #{__dirname}/src/*.coffee to #{__dirname}/lib/*.js"
  exec "#{COFFEE} --compile --output #{__dirname}/lib/ #{__dirname}/src/", (err, stdout, stderr) ->
    throw err if err
    console.log stderr + stdout if stdout + stderr

# Compiling LESS
task 'styles', 'Compiles less templates to CSS', ->
  console.log "Compiling #{__dirname}/src/less/* to #{__dirname}/lib/log.io.css"
  exec "#{LESS} --compress #{__dirname}/src/less/log.io.less #{__dirname}/lib/log.io.css", (err, stdout, stderr) ->
    throw err if err
    console.log stdout + stderr if stdout + stderr

# Porting client to browser
task 'browserify', 'Compiles client.coffee to browser-friendly JS', ->
  console.log "Browserifying #{__dirname}/lib/client.js to #{__dirname}/lib/log.io.js"
  exec "#{BROWSERIFY} -c 'coffee -sc' -r #{__dirname}/src/client.coffee:client.coffee > #{__dirname}/lib/log.io.js", (err, stdout, stderr) ->
    console.log stdout + stderr if err

# Creating config files if do not exists
task 'ensure:configuration', 'Ensures that config files exist in ~/.log.io/', ->
  console.log 'Creating ~/.log.io/ for configuration files.'
  console.log 'If this fails, run npm using a specific user: npm install -g log.io --user \'ubuntu\''
  homedir = process.env[if process.platform is 'win32' then 'USERPROFILE' else 'HOME']
  console.log "Detected home directory: #{homedir}"
  ldir = homedir + '/.log.io/'
  console.log "Creating log.io config directory: #{ldir}"
  fs.mkdirSync ldir if not fs.existsSync ldir
  for c in ['harvester', 'log_server', 'web_server']
    path = ldir + "#{c}.conf"
    if not fs.existsSync path
      console.log "Created new configuration file: #{path}"
      fs.createReadStream("./conf/#{c}.conf").pipe fs.createWriteStream path
    else
      console.log "Configuraton file already exists: #{path}"

task 'cleanup', 'Removes temporary files', ->
  if fs.existsSync 'src/templates.coffee'
    console.log 'Removing', 'src/templates.coffee'
    fs.unlinkSync 'src/templates.coffee'
  if fs.existsSync 'lib/'
    for k, i of fs.readdirSync 'lib/'
      console.log 'Removing', "lib/#{i}"
      fs.unlinkSync "lib/#{i}"
    console.log 'Removing', 'lib/'
    fs.rmdirSync 'lib/'
  console.log 'Project is clean.'
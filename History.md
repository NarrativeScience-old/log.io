# 0.3.4 / 2014-07-30

- Addresses harvester connection durability, fixes #70, #85, #114, #120
- Corrected functional test race condition, fixes #77
- Updates import path in bin scripts

# 0.3.3 / 2013-03-29

- SSL support for WebServer, fixes #31
- Uses localStorage to persist screen state, fixes #44
- Restrict access to HTTP server and socket.io by IP, fixes #59
- Escapes HTML in log messages, fixes #58
- WebClient buffers keystrokes before filtering messages
- Added express framework to WebServer

# 0.3.2 / 2013-03-10

- Harvester handles 'rename' file event, fixes log rotation bug
- Adds HTTP basic authentication for web server

# 0.3.1 / 2013-03-03

- Firefox compatibility; renamed "watch" events on backbone objects
- Server buffers raw TCP messages, fixes #52
- Server host binding support, fixes #53
- Style/Less updates

# 0.3.0 / 2013-02-20

- Complete rewrite using CoffeeScript + Backbone.js
- Server uses backend TCP interface
- Server leverages EventEmitter to decouple components
- Installs in user space, removed forever and adduser dependencies
- No longer daemonized on install, OS-agnostic
- Uses Cake to run builds
- Uses mocha/chai for functional tests
- Replaces LogFile with LogStream concept
  - Harvester configuration maps list of file paths to stream name
  - Web client UI displays nodes by stream name, and vice versa
- Web client UI rebuilt using Backbone.js events, models, and views

# 0.2.7 / 2012-06-18

- Updated install.sh to use useradd instead of adduser for better linux support
- Eased version restrictions on dependencies, removed upper bound of node.js version

# 0.2.6 / 2012-03-02

- Updated connect.js dependency to <=1.8.4

# 0.2.5 / 2012-02-27

- Compatible with node.js v0.6.x
  - Updated socket.io-* dependencies to v0.9.0, fixes socket.io-client bug
- Switched to Iconic icon set in place of famfamfam silk

# 0.2.4 / 2012-02-20

- Eased node.js version restrictions to allow v0.4.9 - v.0.4.12

# 0.2.3 / 2012-01-09

- Upgraded forever dependency to v0.8.2

# 0.2.2 / 2011-12-15

- Upgraded forever dependency to v0.7.5

# 0.2.1 / 2011-09-30

- Reworked installation & daemon process using npm & forever
- Adds custom logging module with log levels
- Creates official 'log.io' npm package

# 0.2.0 / 2011-09-23

- Updates all components to use socket.io v0.8.x
  - Uses custom events (emit) instead of message_type properties
  - Server uses rooms per log file for selective broadcasting
- Harvester uses "official" socket.io-client instead of Socket.io-node-client
- Unit test updates

# 0.1.2 / 2011-07-01

- socket.io v0.7 warnings, configuration updates
- Fixes broken Socket.io-node-client dependency
- Readme updates

# 0.1.1 / 2011-05-20

- Initial release

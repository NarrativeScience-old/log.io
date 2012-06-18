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

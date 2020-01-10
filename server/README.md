Log.io - Real-time log monitoring in your browser
=================================================

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

## Install & run server

1) Install via npm

```
npm install log.io
```

2) Configure hosts & ports (see example below)

```
nano ~/.log.io/server.json
```

3) Run server

```
log.io-server
```

3) Browse to http://localhost:6688

## Server configuration

There are two servers: the message server, which receives TCP messages from message inputs, and the HTTP server, which receives requests from browsers.  By default, the application looks for configuration in `~/.log.io/server.json`, and can be overridden with the environment variable `LOGIO_SERVER_CONFIG_PATH`.

Sample configuration file:

```json
{
  "messageServer": {
    "port": 6689,
    "host": "127.0.0.1"
  },
  "httpServer": {
    "port": 6688,
    "host": "127.0.0.1"
  },
  "debug": false
}

```

## Server TCP interface

The file input connects to the server via TCP, and writes properly formatted strings to the socket.  Custom inputs can send messages to the server using the following commands, each of which ends with a null character:

Send a log message

```
+msg|streamName1|sourceName1|this is log message\0
```

Register a new input

```
+input|streamName1|sourceName1\0
```

Remove an existing input

```
-input|streamName1|sourceName1\0
```

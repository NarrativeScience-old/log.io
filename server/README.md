Log.io - Real-time log monitoring in your browser
=================================================

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache2.0)
[![Version](https://img.shields.io/badge/node-%3E%3D%2012-brightgreen)](https://nodejs.org/)
[![Node](https://img.shields.io/npm/v/log.io)](https://www.npmjs.com/package/log.io)

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

## How does it work?

A **file input** watches log files for changes, sends new messages to the **server** via TCP, which broadcasts to **browsers** via socket.io.

## Terminology

**Stream** - A logical designation for a group of messages that relate to one another.  Examples include an application name, a topic name, or a backend service name.

**Source** - A physical designation for a group of messages that originate from the same source.  Examples include a server name, a service provider name, or a filename.

**Input** - A (stream, source) pair.

While originally designed to represent backend service logs spread across multiple servers, the stream/source abstraction is intentionally open-ended to allow users to define a system topology for their specific use case.

## Install & run server

Install via npm

```
npm install -g log.io
```

Configure hosts & ports (see example below)

```
nano ~/.log.io/server.json
```

Run server

```
log.io-server
```

Browse to http://localhost:6688

## Install & run input

Begin sending log messages to the server via:
- [log.io-file-input](https://www.npmjs.com/package/log.io-file-input)
- A custom TCP input that implements the interface described below

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
  "debug": false,
  "basicAuth": {
    "realm": "abc123xyz",
    "users": {
      "username1": "password1"
    }
  }
}
```
`basicAuth` and `debug` are both optional keys that can be omitted.

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

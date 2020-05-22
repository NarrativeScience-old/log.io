Log.io - Real-time log monitoring in your browser
=================================================

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache2.0)
[![Version](https://img.shields.io/badge/node-%3E%3D%2012-brightgreen)](https://nodejs.org/)
[![Node](https://img.shields.io/npm/v/log.io)](https://www.npmjs.com/package/log.io)


## How does it work?

A **file input** watches log files for changes, sends new messages to the **server** via TCP, which broadcasts to **browsers** via socket.io.

Users can watch adhoc log streams by activating inputs and binding them to multiple screens via the web UI.

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

## Install & run file input

Install via npm

```
npm install -g log.io-file-input
```

Configure file input (see example below)

```
nano ~/.log.io/inputs/file.json
```

Run file input

```
log.io-file-input
```

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

## File input configuration

Inputs are created by associating file paths with stream and source names in a configuration file.  By default, the file input looks for configuration in `~/.log.io/inputs/file.json`, and can be overridden with the environment variable `LOGIO_FILE_INPUT_CONFIG_PATH`.

Input paths can be a file path, directory path or a [glob](https://en.wikipedia.org/wiki/Glob_(programming)).  Additionally, watcher options can be provided for more fine-grained control over file watching mechanics and performance. See the [chokidar](https://github.com/paulmillr/chokidar) documentation for more information.

Sample configuration file:

```json
{
  "messageServer": {
    "host": "127.0.0.1",
    "port": 6689
  },
  "inputs": [
    {
      "source": "server1",
      "stream": "app1",
      "config": {
        "path": "log.io-demo/file-generator/app1-server1.log"
      }
    },
    {
      "source": "server2",
      "stream": "system-logs",
      "config": {
        "path": "/var/log/**/*.log",
        "watcherOptions": {
          "ignored": "*.txt",
          "depth": 99,
        }
      }
    }
  ]
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

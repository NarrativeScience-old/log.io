Usage
=====

    bin/control server start
    bin/control harvester start [osx]


Log.io - Real-time log monitoring in your browser
=================================================

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

## How does it work?

*Harvesters* watch log files for changes, send new log messages to the *server*, which broadcasts to *web clients*.

Users create *stream* and *history* screens to view and search log messages.

## Requirements

[node.js](http://nodejs.org) (>=0.4.9)

[socket.io](http://socket.io) (>=0.9.0)

[socket.io-client](https://github.com/LearnBoost/socket.io-client) (>=0.9.0)

[forever](https://github.com/indexzero/forever) (>=0.8.2)

[connect](http://senchalabs.github.com/connect/) (<=1.8.4)

[underscore](http://documentcloud.github.com/underscore/) (>=1.1.7)

## Compatibility

Harvesters & server have been tested on *Ubuntu 12.04*

Web clients have been tested on *Chrome*, *Safari*, and *Firefox*.

# Install log server on Machine A

1) Install via npm

    sudo npm config set unsafe-perm true 
    sudo npm install -g --prefix=/usr/local log.io

2) Launch server

    sudo log.io server start

3) Browse to:

    http://machine_a.host.com:8998

# Install log harvester on Machine B

1) Install via npm

    sudo npm config set unsafe-perm true 
    sudo npm install -g --prefix=/usr/local log.io

2) Configure harvester (optional; modify /etc/log.io/harvester.conf)

- Server host
- Local log files

3) Launch harvester

    sudo log.io harvester start

## Credits

- Mike Smathers &lt;msmathers@narrativescience.com&gt; ([msmathers](http://github.com/msmathers))

- Narrative Science http://narrativescience.com ([NarrativeScience](http://github.com/NarrativeScience))

## Acknowledgements

- Guillermo Rauch &lt;guillermo@learnboost.com&gt; ([Guille](http://github.com/guille))

- Ryan Dahl &lt;ry at tiny clouds dot org&gt; ([ry](https://github.com/ry)) + Joyent http://www.joyent.com/ ([joyent](https://github.com/joyent/))

- P.J. Onori &lt;http://somerandomdude.com&gt; ([somerandomdude](https://github.com/somerandomdude))

## License 

Copyright 2012 Narrative Science &lt;contrib@narrativescience.com&gt;

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

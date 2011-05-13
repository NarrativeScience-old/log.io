Log.io - Real-time log monitoring in your browser
=================================================

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

## How does it work?

*Harvesters* watch log files for changes, send new log messages to the *server*, which broadcasts to *web clients*. Users create *stream* and *history* screens to view and search log messages.

## Requirements

[node.js](http://nodejs.org)
[socket.io](http://socket.io)
[connect](http://senchalabs.github.com/connect/)
[underscore][(http://documentcloud.github.com/underscore/)
[socket.io-Client](https://github.com/remy/Socket.io-node-client)

## Compatibility

Harvesters & server have been tested on *Ubuntu 10.10*
Web clients have been tested on *Chrome*, *Safari*, and *Firefox*.

## Installation

# Install log server on Machine A

1.  Download source
        git clone git://github.com/NarrativeScience/Log.io.git log.io

2.  Verify dependencies
        cd log.io/bin
        ./configure

3.  Install & launch server
        sudo ./install/server

4.  Browse to:
        http://<machine_a.host.com>:8998

5.  (Optional) Configure port, add HTTP basic auth
    - Modify /etc/log.io/server.conf
        sudo /etc/init.d/log.io-server restart

# Install log harvester on Machine B

1.  Download source
        git clone git://github.com/NarrativeScience/Log.io.git log.io

2.  Verify dependencies
        cd log.io/bin
        ./configure

3.  Install harvester
        sudo ./install/harvester

4.  Configure harvester (modify /etc/log.io/harvester.conf)
    - Server host
    - Local log files

5.  Start harvester
        sudo /etc/init.d/log.io-harvester start

## Credits

- Mike Smathers &lt;msmathers@narrativescience.com&gt; ([msmathers](http://github.com/msmathers))

- Narrative Science &lt;http://narrativescience.com&gt; ([NarrativeScience](http://github.com/NarrativeScience))

## Acknowledgements

- Guillermo Rauch &lt;guillermo@learnboost.com&gt; ([Guille](http://github.com/guille))

- Ryan Dahl &lt;ry at tiny clouds dot org&gt; ([ry](https://github.com/ry)) + Joyent &lt;http://www.joyent.com/&gt; ([joyent](https://github.com/joyent/))

## License 

Copyright 2011 Narrative Science &lt;contrib@narrativescience.com&gt;

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Log.io - Real-time log monitoring in your browser
=================================================

Powered by [node.js](http://nodejs.org) + [socket.io](http://socket.io)

## How does it work?

*Harvesters* watch log files for changes, send new log messages to the *server*, which broadcasts to *web clients*.

Users create *stream* and *history* screens to view and search log messages.

## Requirements

[node.js](http://nodejs.org)

[socket.io (v0.6.17)](http://socket.io) (Log.io is currently incompatible with socket.io v0.7.x)

[connect](http://senchalabs.github.com/connect/)

[underscore](http://documentcloud.github.com/underscore/)

[Socket.io-node-client](https://github.com/msmathers/Socket.io-node-client)

## Compatibility

Harvesters & server have been tested on *Ubuntu 11.04*

Web clients have been tested on *Chrome*, *Safari*, and *Firefox*.

# Install log server on Machine A

1. Download source

    git clone git://github.com/NarrativeScience/Log.io.git log.io

2. Verify dependencies

    cd log.io/bin

    ./configure

3. Install & launch server

    sudo ./install/server

4. Browse to:

    http://&lt;machine_a.host.com&gt;:8998

5. (Optional) Configure port, add HTTP basic auth

    - Modify /etc/log.io/server.conf
    
    sudo /etc/init.d/log.io-server restart

# Install log harvester on Machine B

1. Download source

    git clone git://github.com/NarrativeScience/Log.io.git log.io

2. Verify dependencies

    cd log.io/bin

    ./configure

3. Install harvester

    sudo ./install/harvester

4. Configure harvester (modify /etc/log.io/harvester.conf)

    - Server host

    - Local log files

5. Start harvester

    sudo /etc/init.d/log.io-harvester start

## Credits

- Mike Smathers &lt;msmathers@narrativescience.com&gt; ([msmathers](http://github.com/msmathers))

- Narrative Science http://narrativescience.com ([NarrativeScience](http://github.com/NarrativeScience))

## Acknowledgements

- Guillermo Rauch &lt;guillermo@learnboost.com&gt; ([Guille](http://github.com/guille))

- Ryan Dahl &lt;ry at tiny clouds dot org&gt; ([ry](https://github.com/ry)) + Joyent http://www.joyent.com/ ([joyent](https://github.com/joyent/))

- Remy Sharp &lt;remy@leftlogic.com&gt; ([remy](https://github.com/remy))

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

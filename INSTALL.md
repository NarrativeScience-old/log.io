# Install log server on Machine A

1) Download source

    git clone git://github.com/NarrativeScience/Log.io.git log.io

2) Verify dependencies

    cd log.io/bin
    ./configure

3) Install & launch server

    sudo ./install/server

4) Browse to:

    http://&lt;machine_a.host.com&gt;:8998

5) Configure port, add HTTP basic auth  (Optional)

- Modify /etc/log.io/server.conf
    
    sudo /etc/init.d/log.io-server restart

# Install log harvester on Machine B

1) Download source

    git clone git://github.com/NarrativeScience/Log.io.git log.io

2) Verify dependencies

    cd log.io/bin
    ./configure

3) Install harvester

    sudo ./install/harvester

4) Configure harvester (modify /etc/log.io/harvester.conf)

- Server host
- Local log files

5) Start harvester

    sudo /etc/init.d/log.io-harvester start

# Troubleshooting

Check server and harvester application logs:
    
    /var/log/log.io/server.log
    /var/log/log.io/harvester.log

To manually run server or harvester daemon processes:

    /usr/local/bin/log-harvester
    /usr/local/bin/log-server

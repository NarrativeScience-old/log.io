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

# Troubleshooting

Check server and harvester application logs:
    
    /var/log/log.io/server.log
    /var/log/log.io/harvester.log

To manually run server or harvester processes:

    /usr/local/bin/log.io-server
    /usr/local/bin/log.io-harvester

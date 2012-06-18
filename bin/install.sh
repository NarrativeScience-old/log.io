#! /bin/sh
#
# Log.io install script (run as root)
#

# Symlink /bin/* into /usr/local/bin
echo "Symlink /bin/* to /usr/local/bin/";
ln -s /usr/local/lib/node_modules/log.io/bin/log.io-server /usr/local/bin/log.io-server
ln -s /usr/local/lib/node_modules/log.io/bin/log.io-harvester /usr/local/bin/log.io-harvester
ln -s /usr/local/lib/node_modules/log.io/bin/log.io /usr/local/bin/log.io

# Copy server config to /etc/log.io/
if [ ! -f /etc/log.io/server.conf ];
then
  echo "Copying server.conf to /etc/log.io/";
  mkdir -p /etc/log.io/
  cp /usr/local/lib/node_modules/log.io/etc/conf/server.conf /etc/log.io/
fi 

# Copy harvester config to /etc/log.io/
if [ ! -f /etc/log.io/harvester.conf ];
then
  echo "Copying harvester.conf to /etc/log.io/";
  mkdir -p /etc/log.io/
  cp /usr/local/lib/node_modules/log.io/etc/conf/harvester.conf /etc/log.io/
fi 

# Create logio user
echo "Creating logio user..."
yes | useradd -r -m --home "/usr/local/lib/node_modules/log.io/home" logio > /dev/null

# Add user to adm group (for syslog, apache log, etc...)
# This might not be safe...
echo "Adding logio user to 'adm' group..."
usermod -G adm logio

# Create server log file
if [ ! -f /var/log/log.io/server.log ];
then
  echo "Creating /var/log/log.io/server.log";
  mkdir -p /var/log/log.io/
  touch /var/log/log.io/server.log
  chmod 755 /var/log/log.io/server.log
  chown logio:logio /var/log/log.io/server.log
fi

# Create harvester log file
if [ ! -f /var/log/log.io/harvester.log ];
then
  echo "Creating /var/log/log.io/harvester.log";
  mkdir -p /var/log/log.io/
  touch /var/log/log.io/harvester.log
  chmod 755 /var/log/log.io/harvester.log
  chown logio:logio /var/log/log.io/harvester.log
fi

# Set up logio PATH
echo "Setting up logio user environment";
echo "export PATH=$PATH:/usr/local/lib/node_modules/log.io/node_modules/forever/bin" >> /usr/local/lib/node_modules/log.io/home/.bashrc
echo "export PATH=$PATH:/usr/local/lib/node_modules/log.io/node_modules/forever/bin" >> /usr/local/lib/node_modules/log.io/home/.bash_profile
echo "export PATH=$PATH:/usr/local/lib/node_modules/log.io/node_modules/forever/bin" >> /usr/local/lib/node_modules/log.io/home/.profile

echo "Done!"

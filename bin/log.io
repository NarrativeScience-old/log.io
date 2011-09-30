#!/bin/sh

# Usage: log.io (server|harvester) (start|stop) [user]

if [ "$2" = "start" ]; then
    if [ "$1" = "server" ]; then
        if [ -z "$3" ]; then
            echo "Starting Log.io server...";
            su -c "/usr/local/bin/log.io server start logio" - logio
            echo "Done.";
        else
            ALREADY_RUNNING=`forever list | grep 'log.io-server' | awk '{print $2}' | sed 's/\[//g' | sed 's/\]//g'`;
            if [ -z "$ALREADY_RUNNING" ]; then
                echo "Launching forever process...";
                forever start -o /var/log/log.io/server.log -e /var/log/log.io/server.log /usr/local/bin/log.io-server
                echo "Done."
            else
                echo "Log.io server process is already running, exiting...";
            fi
        fi
    elif [ "$1" = "harvester" ]; then
        if [ -z "$3" ]; then
            echo "Starting Log.io harvester...";
            su -c "/usr/local/bin/log.io harvester start logio" - logio
            echo "Done.";
        else
            ALREADY_RUNNING=`forever list | grep 'log.io-harvester' | awk '{print $2}' | sed 's/\[//g' | sed 's/\]//g'`;
            if [ -z "$ALREADY_RUNNING" ]; then
                echo "Launching forever process...";
                forever start -o /var/log/log.io/harvester.log -e /var/log/log.io/harvester.log /usr/local/bin/log.io-harvester
                echo "Done."
            else
                echo "Log.io harvester process is already running, exiting...";
            fi
        fi
    fi
elif [ "$2" = "stop" ]; then
    if [ "$1" = "server" ]; then
        if [ -z "$3" ]; then
            echo "Stopping Log.io server...";
            su -c "/usr/local/bin/log.io server stop logio" - logio
            echo "Done.";
        else
            echo "Stopping forever process...";
            PROC_NUM=`forever list | grep 'log.io-server' | awk '{print $2}' | sed 's/\[//g' | sed 's/\]//g'`;
            if [ -z "$PROC_NUM" ]; then
                echo "No server process found, nothing to do.";
            else
                forever stop $PROC_NUM
            fi
            echo "Done."
        fi
    elif [ "$1" = "harvester" ]; then
        if [ -z "$3" ]; then
            echo "Stopping Log.io harvester...";
            su -c "/usr/local/bin/log.io harvester stop logio" - logio
            echo "Done.";
        else
            echo "Stopping forever process...";
            PROC_NUM=`forever list | grep 'log.io-harvester' | awk '{print $2}' | sed 's/\[//g' | sed 's/\]//g'`;
            if [ -z "$PROC_NUM" ]; then
                echo "No harvester process found, nothing to do."
            else
                forever stop $PROC_NUM
            fi
            echo "Done."
        fi
    fi
fi
# Builds UI package, copy static assets into server lib/

#!/usr/bin/env bash
ROOTDIR=$(cd `dirname $0` && pwd)/../..
cd $ROOTDIR/ui
npm install
npm run build
mkdir -p $ROOTDIR/server/lib/ui
cp -r $ROOTDIR/ui/build/* $ROOTDIR/server/lib/ui

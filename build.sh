#!/bin/sh -e

export PATH=node_modules/.bin:$PATH

cake build
cake ensure:configuration

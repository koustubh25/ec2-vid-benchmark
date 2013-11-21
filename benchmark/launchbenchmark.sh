#!/bin/sh
# Benchmark stat file name
SRC_FILE=~/benchmark/$1
STATFILE=~/benchmark/logs/$2.stats

# Pass 1:
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 1 --slow-firstpass --stats $STATFILE -t 2 --no-fast-pskip --cqm flat -v $SRC_FILE -o /dev/null 2>&1

# Pass 2:
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 2 --stats $STATFILE -t 2 --no-fast-pskip --cqm flat -v $SRC_FILE -o /dev/null 2>&1

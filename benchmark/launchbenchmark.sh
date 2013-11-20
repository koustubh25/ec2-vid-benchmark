#!/bin/sh
# Benchmark stat file name
SRC_FILE=$1
STATFILE=$2.stats

# Pass 1:
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 1 --slow-firstpass --stats logs/$STATFILE -t 2 --no-fast-pskip --cqm flat $SRC_FILE -o benchmark_1stpass.264

# Pass 2:
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 2 --stats logs/$STATFILE -t 2 --no-fast-pskip --cqm flat $SRC_FILE -o benchmark_2ndpass.264

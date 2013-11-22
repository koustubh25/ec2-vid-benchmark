#!/bin/sh
# Benchmark stat file name
SRC_FILE=~/benchmark/$1
LOG_DIR=~/benchmark/logs
STATFILE=$LOG_DIR/$2.stats
OUT_1=$LOG_DIR/$2_1.out
OUT_2=$LOG_DIR/$2_2.out

# Pass 1:
echo '*** Starting 1st pass...'
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 1 --slow-firstpass --stats $STATFILE -t 2 --no-fast-pskip --cqm flat -v -o ~/benchmark/benchmark_1stpass.264 $SRC_FILE &> $OUT_1

# Pass 2:
echo '*** Starting 2nd pass...'
/usr/local/bin/x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 2 --stats $STATFILE -t 2 --no-fast-pskip --cqm flat -v -o ~/benchmark/benchmark_2ndpass.264 $SRC_FILE &> $OUT_2

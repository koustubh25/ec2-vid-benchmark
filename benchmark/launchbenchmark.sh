#!/bin/sh
# Benchmark stat file name
STATFILE=$1.stats

# Pass 1:
x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 1 --slow-firstpass --stats logs/$STATFILE -t 2 --no-fast-pskip --cqm flat elephantsdream_source.264 -o benchmark_1stpass.264

# Pass 2:
x264 --preset veryslow --tune film --b-adapt 2 --b-pyramid normal -r 3 -f -2:0 --bitrate 10000 --aq-mode 1 -p 2 --stats logs/$STATFILE -t 2 --no-fast-pskip --cqm flat elephantsdream_source.264 -o benchmark_2ndpass.264

wait $!

# TimeStamp
echo `env TZ='America/Los_Angeles' date` > logs/$1_finished

# Compress log and put s3
tar zcvf $1.tgz logs/*
aws s3 cp $1.tgz s3://iomz-benchmark/

# Shutdown
if [ -e /etc/rc.local.bck ]; then
  mv /etc/rc.local.bck /etc/rc.local
fi

wait $!
sudo halt

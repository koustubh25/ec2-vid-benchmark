#!/bin/bash
# user data for benchmark

# Fetch files for benchmark and reboot
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/bench.tgz | tar zxv -C ~/

# Set the video source
#SRC_FILE="240p.mp4"
SRC_FILE="elephantsdream_source.264"

# Run benchmark
if [ $SRC_FILE != "elephantsdream_source.264" ]; then
  echo "~/startbench.sh $SRC_FILE" >> /etc/rc.local
else
  echo "~/startbench.sh" >> /etc/rc.local
fi

# reboot
reboot

#!/bin/bash
# user data for x264benchmark
# Fetch files for benchmarking
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/x264bench.tgz | tar zxv -C ~/

# Set the video source
#SRC_FILE="240p.mp4"
SRC_FILE="elephantsdream_source.264"

# Register benchmark
if [ $SRC_FILE != "elephantsdream_source.264" ]; then
  echo "~/x264bench.sh $SRC_FILE" >> /etc/rc.local
else
  echo "~/x264bench.sh" >> /etc/rc.local
fi

# reboot
reboot

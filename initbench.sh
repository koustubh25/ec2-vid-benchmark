#!/bin/sh
# Sert the video source
#SRC_FILE="240p.mp4"
SRC_FILE="elephantsdream_source.264"

# Fetch files for benchmark and reboot
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/bench.tgz | sudo tar zxv -C /root/

# Overwrite /etc/rc.local for startup script
if grep -q startbench.sh "/etc/rc.local"; then
  echo "Already loaded"
else
  sudo cp /etc/rc.local /etc/rc.local.bck
  if [ $SRC_FILE != "elephantsdream_source.264" ]; then
    sudo sh -c "echo '/root/startbench.sh $SRC_FILE' >> /etc/rc.local"
  else
    sudo sh -c "echo '/root/startbench.sh' >> /etc/rc.local"
  fi
fi

sudo reboot

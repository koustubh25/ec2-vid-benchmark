#!/bin/sh
# Fetch files for benchmark and reboot
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/bench.tgz | sudo tar zxv -C /root/

# Overwrite /etc/rc.local for startup script
if grep -q startbench.sh "/etc/rc.local"; then
  echo "Already loaded"
else
  sudo cp /etc/rc.local /etc/rc.local.bck
  sudo sh -c 'echo "/root/startbench.sh" >> /etc/rc.local'
fi

sudo reboot

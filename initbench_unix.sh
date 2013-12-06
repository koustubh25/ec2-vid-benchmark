#!/bin/bash
# user data for benchmark: UnixBench

# Fetch files for benchmark
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/unixbench.tgz | tar zxv -C ~/

# Register benchmark
echo "~/unixbench.sh" >> /etc/rc.local

# reboot
reboot

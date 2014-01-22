#!/bin/bash
# user data for benchmark: UnixBench
# If benchmark is performed already, do nothing
if [ -e ~/unixbench_finished ]; then
  exit
fi

IDESC=`cat /var/local/instance_name`

echo "*** Performing benchmark on \"$IDESC\"..."
cd ~/UnixBench/
./Run &> ~/${IDESC}_unixbench.log

# halt
env TZ='America/Los_Angeles' date > ~/unixbench_finished
echo '*** Benchmarking script completed, now halting the system...'
halt

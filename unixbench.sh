#!/bin/bash
# user data for benchmark: UnixBench

TRIED=0
while [ $TRIED -lt $# ]
do
  if [ -e ~/unixbench_tried ]; then
    TRIED=`cat ~/unixbench_tried`
  fi
  
  IDESC=`cat /var/local/instance_name`
  
  echo "*** Starting UnixBench on \"$IDESC\"..."
  cd ~/UnixBench/
  ./Run &> ~/${IDESC}_${TRIED}.log
  
  #env TZ='America/Los_Angeles' date > ~/unixbench_finished
  echo `expr $TRIED + 1` > ~/unixbench_tried
  echo "*** UnixBench trial $TRIED finished!"
done

# halt
echo '*** Benchmarking script completed, now halting the system...'
halt

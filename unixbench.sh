#!/bin/bash
# user data for benchmark: UnixBench

if [ -e ~/unixbench_finished ]; then
  exit
fi

TRIED=0
IDESC=`cat /var/local/instance_name`
mkdir -p ~/log
echo "*** Starting UnixBench on \"$IDESC\"..."
while [ $TRIED -lt $# ]
do
  cd ~/UnixBench/
  ./Run &> ~/log/${IDESC}_${TRIED}.log
  python ~/upload_log.py $IDESC $TRIED
  TRIED=`expr $TRIED + 1`
  echo $TRIED > ~/unixbench_tried
  echo "*** UnixBench trial $TRIED finished!"
done

# halt
echo '*** Benchmarking script completed, now halting the system...'
env TZ='America/Los_Angeles' date > ~/unixbench_finished
halt

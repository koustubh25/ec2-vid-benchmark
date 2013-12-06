#!/bin/bash
# user data for benchmark: UnixBench
# If benchmark is performed already, do nothing
if [ -e ~/unixbench_finished ]; then
  exit
fi

# Prepare the dependencies
yum -y update
yum -y install gcc perl-Time-HiRes s3cmd autoconf automake make
echo '*** Dependency all installed and updated'

# jq
if [ -e /usr/bin/jq ]; then
  echo '*** jq already installed'
else
  echo '*** Installing jq...'
  cd ~
  wget http://stedolan.github.io/jq/download/linux64/jq
  chmod +x jq
  mv jq /usr/bin/jq
  echo '*** jq installed'
fi

# Compile and run the benchmark
cd ~/unixbench/
make
echo '*** Retrieving the description of this instance...'
ID_JSON=`wget -q -O - http://169.254.169.254/latest/dynamic/instance-identity/document`
IID=`echo $ID_JSON | /usr/bin/jq '.instanceId' | awk -F\" '{print $2}'`
ITYPE=`echo $ID_JSON | /usr/bin/jq '.instanceType' | awk -F\" '{print $2}'`
VIRTYPE=`/usr/bin/aws ec2 describe-instances --instance-ids $IID | /usr/bin/jq '.Reservations[].Instances[].VirtualizationType' | awk -F\" '{print $2}'`
EBSOPT=`/usr/bin/aws ec2 describe-instances --instance-ids $IID | jq '.Reservations[].Instances[].EbsOptimized'`
if [ $EBSOPT == true ]; then
  echo "${VIRTYPE}_${ITYPE}_EbsOptimized" > ~/InstanceDesc 
else
  echo "${VIRTYPE}_${ITYPE}" > ~/InstanceDesc 
fi
IDESC=`cat ~/InstanceDesc`

echo "*** Performing benchmark on \"$IDESC\"..."
./Run &> ~/${IDESC}_unixbench.log
aws s3 cp ~/${IDESC}_unixbench.log s3://iomz-benchmark/unixbench/

# halt
env TZ='America/Los_Angeles' date > ~/unixbench_finished
echo '*** Benchmarking script completed, now halting the system...'
halt

#!/bin/bash
# user data for benchmark: UnixBench
# If benchmark is performed already, do nothing
if [ -e ~/unixbench_finished ]; then
  exit
fi

# Prepare the dependencies
if [ ! -e /etc/yum.repos.d/s3tools.repo ]; then
  echo "*** Adding s3tools.repo into \"/etc/yum.repos.d/\"..."
  cd /etc/yum.repos.d && wget http://s3tools.org/repo/RHEL_6/s3tools.repo
fi
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

# Fetch files for benchmark
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/UnixBench5.1.3.tgz | tar zxv -C ~/

# Compile and run the benchmark
cd ~/UnixBench/
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
./Run &> ~/$IDESC_unixbench.log
aws s3 cp ~/$IDESC_unixbench.log s3://iomz-benchmark/unixbench/

# halt
env TZ='America/Los_Angeles' date > ~/unixbench_finished
echo '*** Benchmarking script completed, now halting the system...'
halt

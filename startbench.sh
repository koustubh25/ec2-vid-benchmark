#!/bin/sh
# If benchmark is performed already, do nothing
if [ -e ~/finished ]; then
  exit
fi

echo "*** Running startbench.sh by `whoami`..."

# Prepare video source
if [ $# == 1 ]; then
  SRC_FILE=$1
else
  SRC_FILE='elephantsdream_source.264'
fi

if [ ! -e ~/benchmark/$SRC_FILE ]; then
  if [ $SRC_FILE=='elephantsdream_source.264' ]; then
    echo "*** Downloading \"$SRC_FILE\"..."
    wget -O ~/benchmark/elephantsdream_source.264 http://www.zumzocken.de/va_x264/elephantsdream_source.264
  else
    echo "*** The source file \"$SRC_FILE\" doesn't exist... Shutting down..."
    halt
  fi
fi
echo "*** Using video \"$SRC_FILE\" as a source"

# Prepare the dependencies
if [ ! -e /etc/yum.repos.d/s3tools.repo ]; then
  echo "*** Adding s3tools.repo into \"/etc/yum.repos.d/\"..."
  cd /etc/yum.repos.d && wget http://s3tools.org/repo/RHEL_6/s3tools.repo
fi
yum -y update
yum -y install autoconf automake gcc gcc-c++ git libtool make nasm pkgconfig zlib-devel yasm s3cmd
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

# libav
if [ -e /usr/local/bin/avconv ]; then
  echo '*** libav already installed'
else
  echo '*** Installing libav...'
  cd ~
  tar zxvf libav-HEAD*.gz -C ~/
  cd ~/libav-HEAD*
  ./configure --enable-gpl --enable-nonfree
  make && make install
fi

# x264benchmark
if [ -e /usr/local/bin/x264 ]; then
  echo '*** x264 already installed'
else
  echo '*** Installing x264...'
  cd ~
  tar xvjf ~/last_x264*.bz2 -C ~/
  cd ~/x264-snapshot*
  LAVF=`./configure | grep lavf | sed -e 's/^.*\s\+//'`
  if [ $LAVF == 'no' ] ; then
    echo "*** lavf not linked correctly... shutting down"
    halt
  fi
  make && make install
fi

# Run benchmark
echo '*** Retrieving the description of this instance...'
ID_JSON=`wget -q -O - http://169.254.169.254/latest/dynamic/instance-identity/document`
IID=`echo $ID_JSON | /usr/bin/jq '.instanceId' | awk -F\" '{print $2}'`
ITYPE=`echo $ID_JSON | /usr/bin/jq '.instanceType' | awk -F\" '{print $2}'`
VIRTYPE=`/usr/bin/aws ec2 describe-instances --instance-ids $IID | /usr/bin/jq '.Reservations[].Instances[].VirtualizationType' | awk -F\" '{print $2}'`
EBSOPT=`/usr/bin/aws ec2 describe-instances --instance-ids $IID | jq '.Reservations[].Instances[].EbsOptimized'`
#REGION=`echo $ID_JSON | /usr/bin/jq '.region' | awk -F\" '{print $2}'`
#IMGID=`echo $ID_JSON | /usr/bin/jq '.imageId' | awk -F\" '{print $2}'`
if [ $EBSOPT == true ]; then
  echo "${VIRTYPE}_${ITYPE}_EbsOptimized" > ~/InstanceDesc 
else
  echo "${VIRTYPE}_${ITYPE}" > ~/InstanceDesc 
fi
IDESC=`cat ~/InstanceDesc`

echo "*** Performing benchmark on \"$IDESC\"..."
rm -f ~/benchmark/bench*
rm -f ~/benchmark/*.tgz
mkdir -p ~/benchmark/logs
rm -f ~/benchmark/logs/*
chmod +x ~/benchmark/launchbenchmark.sh
screen -d -m /usr/bin/time -o ~/benchmark/logs/$IDESC.log ~/benchmark/launchbenchmark.sh $SRC_FILE $IDESC

while screen -list | grep Detached &> /dev/null
do
  sleep 5
done

# Compress log and put s3
echo '*** Benchmark finished, upload the logs to the s3 bucket...'
cd ~/benchmark
tar zcvf $IDESC.tgz logs/*
aws s3 cp $IDESC.tgz s3://iomz-benchmark/

echo '*** Benchmarking script completed, now halting the system...'
env TZ='America/Los_Angeles' date > ~/finished
halt

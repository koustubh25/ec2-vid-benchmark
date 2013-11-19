#!/bin/sh
# Prepare the dependencies
if [ ! -e /etc/yum.repos.d/s3tools.repo ]; then
  cd /etc/yum.repos.d && wget http://s3tools.org/repo/RHEL_6/s3tools.repo
fi
yum -y update
yum -y install autoconf automake gcc gcc-c++ git libtool make nasm pkgconfig zlib-devel yasm s3cmd

wait $!
# Determine the instance type
if [ -e /usr/bin/jq ]; then
  echo 'jq already installed'
else
  cd ~
  wget http://stedolan.github.io/jq/download/linux64/jq
  chmod +x jq
  mv jq /usr/bin/jq
  echo 'jq installed'
fi
IID=`wget -q -O - http://169.254.169.254/latest/meta-data/instance-id`
echo `aws ec2 describe-instance-attribute --instance-id $IID --attribute instanceType | /usr/bin/jq '.InstanceType.Value' | sed -e 's/^"//'  -e 's/"$//'` > ~/InstanceType

wait $!
# libav
if [ -e /usr/local/bin/avconv ]; then
  echo 'libav already installed'
else
  cd ~
  tar zxvf libav-HEAD*.gz -C ~/
  cd ~/libav-HEAD*
  ./configure --enable-gpl --enable-nonfree
  make && make install
fi

wait $!
# x264benchmark
if [ -e /usr/local/bin/x264 ]; then
  echo 'x264 already installed'
else
  cd ~
  tar xvjf ~/last_x264*.bz2 -C ~/
  cd ~/x264-snapshot*
  LAVF=`./configure | grep lavf | sed -e 's/^.*\s\+//'`
  if [ $LAVF == 'no' ] ; then
    echo "lavf not linked correctly... shutting down"
    halt
  fi
  make && make install
fi

wait $!
# Run benchmark
ITYPE=`cat ~/InstanceType`
echo "Instance Type: $ITYPE"
rm -fr ~/benchmark/bench*
cd ~/benchmark
mkdir -p logs
chmod +x launchbenchmark.sh
#curl -O http://www.zumzocken.de/va_x264/elephantsdream_source.264

wait $!
/usr/bin/screen -d -m /usr/bin/time -o ~/benchmark/logs/$ITYPE.log ~/benchmark/launchbenchmark.sh $ITYPE

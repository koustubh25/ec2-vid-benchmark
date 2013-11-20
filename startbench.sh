#!/bin/sh
# Disable startup script
whoami
if [ -e /etc/rc.local.bck ]; then
  echo "Cleaning up /etc/rc.local"
  mv /etc/rc.local.bck /etc/rc.local
fi
cat /etc/rc.local

## Prepare video source
#if [ $# == 1 ]; then
#  SRC_FILE=$1
#else
#  SRC_FILE='elephantsdream_source.264'
#fi
#
#if [ ! -e ~/benchmark/$SRC_FILE ]; then
#  if [ $SRC_FILE=='elephantsdream_source.264' ]; then
#    curl http://www.zumzocken.de/va_x264/elephantsdream_source.264 -o ~/benchmark/elephantsdream_source.264
#  else
#    echo "The source file \"$SRC_FILE\" doesn't exist... Shutting down..."
#    halt
#  fi
#fi
#
## Prepare the dependencies
#if [ ! -e /etc/yum.repos.d/s3tools.repo ]; then
#  cd /etc/yum.repos.d && wget http://s3tools.org/repo/RHEL_6/s3tools.repo
#fi
#yum -y update
#yum -y install autoconf automake gcc gcc-c++ git libtool make nasm pkgconfig zlib-devel yasm s3cmd
#
## Determine the instance type
#if [ -e /usr/bin/jq ]; then
#  echo 'jq already installed'
#else
#  cd ~
#  wget http://stedolan.github.io/jq/download/linux64/jq
#  chmod +x jq
#  mv jq /usr/bin/jq
#  echo 'jq installed'
#fi
#ID_JSON=`wget -q -O - http://169.254.169.254/latest/dynamic/instance-identity/document`
#REGION=`echo $ID_JSON | /usr/bin/jq '.region' | awk -F\" '{print $2}'`
#ITYPE=`echo $ID_JSON | /usr/bin/jq '.instanceType' | awk -F\" '{print $2}'`
#IMGID=`echo $ID_JSON | /usr/bin/jq '.imageId' | awk -F\" '{print $2}'`
#DIV="_"
#echo "$REGION$DIV$ITYPE$DIV$IMGID" > ~/InstanceDesc
#
## libav
#if [ -e /usr/local/bin/avconv ]; then
#  echo 'libav already installed'
#else
#  cd ~
#  tar zxvf libav-HEAD*.gz -C ~/
#  cd ~/libav-HEAD*
#  ./configure --enable-gpl --enable-nonfree
#  make && make install
#fi
#
## x264benchmark
#if [ -e /usr/local/bin/x264 ]; then
#  echo 'x264 already installed'
#else
#  cd ~
#  tar xvjf ~/last_x264*.bz2 -C ~/
#  cd ~/x264-snapshot*
#  LAVF=`./configure | grep lavf | sed -e 's/^.*\s\+//'`
#  if [ $LAVF == 'no' ] ; then
#    echo "lavf not linked correctly... shutting down"
#    halt
#  fi
#  make && make install
#fi
#
## Run benchmark
#IDESC=`cat ~/InstanceDesc`
#echo "Perform benchmark on \"$IDESC\""
#rm -fr ~/benchmark/bench*
#mkdir -p ~/benchmark/logs
#chmod +x ~/benchmark/launchbenchmark.sh
#/usr/bin/screen -d -m /usr/bin/time -o ~/benchmark/logs/$IDESC.log ~/benchmark/launchbenchmark.sh $SRC_FILE $IDESC
#
#while screen -list | grep Detached &> /dev/null
#do
#  sleep 5
#done
#
#wait $!
## TimeStamp
#echo `env TZ='America/Los_Angeles' date` > ~/benchmark/logs/$IDESC.finished
#
## Compress log and put s3
#cd ~/benchmark
#tar zcvf $IDESC.tgz logs/*
#/usr/bin/screen -d -m aws s3 cp $IDESC.tgz s3://iomz-benchmark/
#
#while screen -list | grep Detached &> /dev/null
#do
#  sleep 5
#done

echo "Benchmark finished, now halting the system!"
env TZ='America/Los_Angeles' date
halt

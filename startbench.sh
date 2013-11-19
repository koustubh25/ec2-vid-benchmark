#!/bin/sh
# Prepare the dependencies
sudo yum -y update
sudo yum -y install autoconf automake gcc gcc-c++ git libtool make nasm pkgconfig zlib-devel yasm

# Determine the instance type
if [ -e /usr/bin/jq ]; then
  echo 'jq already installed'
else
  cd ~
  wget http://stedolan.github.io/jq/download/linux64/jq
  chmod +x ~/jq
  sudo mv ~/jq /usr/bin/
fi
IID=`wget -q -O - http://169.254.169.254/latest/meta-data/instance-id`
echo `aws ec2 describe-instance-attribute --instance-id $IID --attribute instanceType | /usr/bin/jq '.InstanceType.Value' | sed -e 's/^"//'  -e 's/"$//'` > ~/InstanceType

# libav
if [ -e /usr/local/bin/avconv ]; then
  echo 'libav already installed'
else
  cd ~
  tar zxvf /home/ec2-user/libav-HEAD*.gz -C /home/ec2-user
  cd ~/libav-HEAD*
  ./configure --enable-gpl --enable-nonfree
  make
  sudo make install
fi

# x264benchmark
if [ -e /usr/local/bin/x264 ]; then
  echo 'x264 already installed'
else
  cd ~
  tar xvjf ~/last_x264*.bz2 -C ~/
  cd ~/x264-snapshot*
  ./configure
  #./configure | grep 'lavf:          yes' &> /dev/null
  #if [ $? == 0 ] ; then
  #	sudo halt
  #fi
  make
  sudo make install
fi

# x264 benchmark
ITYPE=`cat ~/InstanceType`
echo "Instance Type: $ITYPE"
rm -fr ~/benchmark/bench*
cd ~/benchmark
#curl -O http://www.xin.at/x264/files/launchbenchmark.sh
chmod +x launchbenchmark.sh
#curl -O http://www.zumzocken.de/va_x264/elephantsdream_source.264
/usr/bin/screen -d -m /usr/bin/time -o ~/benchmark/logs/$ITYPE.log ~/benchmark/launchbenchmark.sh $ITYPE

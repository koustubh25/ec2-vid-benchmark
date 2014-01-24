#!/bin/sh
TRIAL=5
INSTANCE_NAME=`cat /var/local/instance_name`

# user data for benchmark: UnixBench

# Prepare the dependencies (for RedHat linux only)
yum -y update
yum -y install gcc perl-Time-HiRes autoconf automake make patch wget git
echo '*** Dependency all installed and updated'

# Fetch files for benchmark
wget --no-check-certificate -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/unixbench.tgz | tar zxv -C ~/
wget -O - https://byte-unixbench.googlecode.com/files/UnixBench5.1.3.tgz |tar zxv -C ~/

# Register benchmark
echo "~/run_unixbench.sh $TRIAL" >> /etc/rc.local

# If boto is not installed, install it
if [ ! `python ~/check_boto.py` ]; then
  git clone git://github.com/boto/boto.git ~/boto
  cd ~/boto
  python ~/boto/setup.py install
  echo '*** boto installed'
  python ~/check_boto.py # create a table based on instance_name
fi

# Compile the UnixBench
cd ~/UnixBench
make
# Patch for > 16 CPUs https://code.google.com/p/byte-unixbench/issues/detail?id=4
wget --no-check-certificate -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/fix-limitation.patch > fix-limitation.patch
patch Run fix-limitation.patch

# reboot
reboot

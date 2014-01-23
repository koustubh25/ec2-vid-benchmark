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
echo "~/unixbench.sh $TRIAL" >> /etc/rc.local

# If boto is not installed, install it
if [ ! `python ~/boto_check.py` ]; then
  git clone git://github.com/boto/boto.git ~/boto
  python ~/boto/setup.py install
fi
python ~/boto_check.py # create a table based on instance_name

# Compile the UnixBench
cd ~/UnixBench
make
# Patch for > 16 CPUs https://code.google.com/p/byte-unixbench/issues/detail?id=4
wget -O - 'https://byte-unixbench.googlecode.com/issues/attachment?aid=-1645413311807741160&name=fix-limitation.patch&token=V2bPd6prIOaORwo_9gduNUqjIRg%3A1390410298044' > fix-limitation.patch
patch Run fix-limitation.patch

# reboot
reboot

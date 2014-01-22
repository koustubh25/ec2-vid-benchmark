# user data for benchmark: UnixBench

# Fetch files for benchmark
wget -O - https://s3-us-west-1.amazonaws.com/iomz-benchmark/unixbench.tgz | tar zxv -C ~/
wget -O - https://byte-unixbench.googlecode.com/files/UnixBench5.1.3.tgz |tar zxv -C ~/

# Register benchmark
echo "~/unixbench.sh" >> /etc/rc.local
echo $INSTANCE_NAME > /var/local/instance_name

# Prepare the dependencies
yum -y update
yum -y install gcc autoconf automake make
echo '*** Dependency all installed and updated'

# Compile and run the benchmark
cd ~/UnixBench/
make

# reboot
reboot

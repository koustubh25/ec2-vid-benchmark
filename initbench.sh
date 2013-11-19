if grep -q ec2-user "/etc/rc.local"; then
  echo "Already loaded"
else
  sudo cp /etc/rc.local /etc/rc.local.bck
  echo "/bin/su - -- ec2-user -l -c '/home/ec2-user/startbench.sh'" >> /etc/rc.local
fi
wget -O- https://s3-us-west-1.amazonaws.com/iomz-benchmark/bench.tgz | tar zxv
reboot

#!/bin/sh
for ITYPE in t1.micro m1.small m1.medium m1.large m1.xlarge m3.xlarge m3.2xlarge m2.xlarge m2.2xlarge m2.4xlarge c1.medium c1.xlarge
do
  echo $ITYPE
  aws ec2 run-instances --image-id ami-14566751 --count 1 --instance-type $ITYPE --key-name iomz@cisco-macbook --security-groups launch-wizard-1
done

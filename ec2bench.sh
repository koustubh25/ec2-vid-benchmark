#!/bin/sh
AMI_ID=ami-ae5c6deb
KEY_NAME=iomz@cisco-macbook
SEC_GRP=launch-wizard-1

for ITYPE in t1.micro m1.small m1.medium m1.large m1.xlarge m3.xlarge m3.2xlarge m2.xlarge m2.2xlarge m2.4xlarge c1.medium c1.xlarge
do
  echo $ITYPE
  aws ec2 run-instances --image-id $AMI_ID --count 1 --instance-type $ITYPE --key-name $KEY_NAME --security-groups $SEC_GRP 
done

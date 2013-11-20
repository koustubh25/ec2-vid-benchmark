#!/bin/sh
#AMI_ID=ami-ae5c6deb # us-west-1 paravirtual
Paravirtual_AMI=
HVM_AMI=
KEY_NAME=iomz@cisco-macbook
SEC_GRP=defaut

# m3.xlarge and m3.2xlarge have 2 different OS types (Paravirtual or HVM)
# Paravirtual
for ITYPE in t1.micro m1.small m1.medium m1.large m1.xlarge m3.xlarge m3.2xlarge m2.xlarge m2.2xlarge m2.4xlarge c1.medium c1.xlarge
do
  echo "Paravirtual $ITYPE"
  #aws ec2 run-instances --image-id $Paravirtual_AMI --count 1 --instance-type $ITYPE --key-name $KEY_NAME --security-groups $SEC_GRP 
done

# HVM
for ITYPE in m3.xlarge m3.2xlarge hi1.4xlarge hs1.8xlarge c3.large c3.xlarge c3.2xlarge c3.4xlarge c3.8xlarge cc1.4xlarge cg1.4xlarge cc2.8xlarge cr1.8xlarge g2.2xlarge
do
  echo "HVM $ITYPE"
  #aws ec2 run-instances --image-id $HVM_AMI --count 1 --instance-type $ITYPE --key-name $KEY_NAME --security-groups $SEC_GRP 
done

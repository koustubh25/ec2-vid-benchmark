#!/bin/sh
Paravirtual_AMI=ami-83e4bcea # Amazon Linux AMI 2013.09.1 [us-east-1]
HVM_AMI=ami-d1bfe4b8 # Amazon Linux AMI (HVM) 2013.09.1 [us-east-1]
ITYPE=m3.2xlarge
KEY_NAME=iomz@cisco-macbook
SEC_GRP=quick-start-1
USER_SCRIPT=`openssl enc -base64 -in initbench.sh`

aws ec2 run-instances --image-id $Paravirtual_AMI --count 1 --instance-type $ITYPE --key-name $KEY_NAME --security-groups $SEC_GRP --user-data "$USER_SCRIPT"
aws ec2 run-instances --image-id $HVM_AMI --count 1 --instance-type $ITYPE --key-name $KEY_NAME --security-groups $SEC_GRP --user-data "$USER_SCRIPT"

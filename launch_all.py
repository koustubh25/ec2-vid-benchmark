#!/usr/bin/python
# -*- coding: utf-8 -*-
from boto.dynamodb2.fields import HashKey, RangeKey
from boto.dynamodb2.table import Table
from boto.exception import JSONResponseError
import base64
import boto.ec2
import sys
import time

# Number of trial
trial = 5

# Amazon Linux AMI 2013.09.2 [us-east-1]
paravirtual_ami = 'ami-83e4bcea'
# Amazon Linux AMI (HVM) 2013.09.2 [us-east-1]
hvm_ami = 'ami-d1bfe4b8'

# Lists of instance types to be benchmarked and already completed
instances = []
completed = []
try:
    ec2_instances = Table('ec2_instances')
    ec2_instances.describe()
except JSONResponseError:
    print "Instance information retrieval failed. Check the 'ec2_instances' table"
    sys.exit()

for item in ec2_instances.scan():
    instance_name = item['Instance Name']
    try:
        instance_logs = Table(instance_name)
        instance_logs.describe()
        completed.append(instance_name)
    except JSONResponseError:
        instances.append(instance_name)

# Confirm ~/.boto exists and contains credentials
region = 'us-east-1'
k_name = 'iomz@cisco-macbook'
s_grp = 'quick-start-1'

def launch_benchmark(conn, instance):
    if 'paravirtual' in instance:
        ami = paravirtual_ami
    else:
        ami = hvm_ami
    if 'ebs' in instance:
        ebs = True
    else:
        ebs = False
    size = instance.split('_')[0]
    # Generate an user-script per instance
    u_data = base64.b64encode("#!/bin/bash\nTRIAL=%d\nINSTANCE_NAME=%s\n"%(trial,instance) + open('initbench_unix.sh','r').read())

    try:
        i = conn.run_instances(
            ami,
            instance_type=size,
            key_name=k_name,
            max_count=1,
            security_groups=[s_grp],
            user_data=u_data,
            ebs_optimized=ebs
            ).instances[0]
    except:
        print "%s launch failed" % (instance)
        return None
    print "{0}({1}) launched at: {2}".format(instance, i.id, i.launch_time)
    time.sleep(5) # Wait before tagging
    conn.create_tags([i.id], {"Name": instance})
    return instance

def main():
    # Start all the benchmark at once will most likely exceeds the quota limit per user
    # Better to execute the benchmark on a category to category basis
    conn = boto.ec2.connect_to_region(region)
    
    #instances = ['c1.medium_paravirtual']
    while 0 < len(instances):
        for i in completed:
            if i in instances:
                instances.remove(i)
        for i in instances:
            res = launch_benchmark(conn, i)
            if res is not None and not res in completed:
                completed.append(res)
            time.sleep(5)
        for i in instances:
            print '%s is waiting for launch' % i
        time.sleep(60*30)

if __name__ == "__main__":
    main()

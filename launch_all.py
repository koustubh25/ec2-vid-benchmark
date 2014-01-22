#!/usr/bin/python
# -*- coding: utf-8 -*-
import base64
import boto.ec2
import sys
import time
from boto.dynamodb2.table import Table

# Amazon Linux AMI 2013.09.2 [us-east-1]
paravirtual_ami = 'ami-83e4bcea'
# Amazon Linux AMI (HVM) 2013.09.2 [us-east-1]
hvm_ami = 'ami-d1bfe4b8'

# List of instance types to be benchmarked
instances = []
for item in Table('ec2_instances').scan():
    instances.append(item['Instance Name'])
completed = []

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
    u_data = base64.b64encode("#!/bin/bash\nINSTANCE_NAME=%s\n"%instance + open('initbench_unix.sh','r').read())

    try:
        reservation = conn.run_instances(
            ami,
            instance_type=size,
            key_name=k_name,
            max_count=1,
            security_groups=[s_grp],
            user_data=u_data,
            ebs_optimized=ebs
            ).instances[0]
    except:
        print "%s_%s launch failed" % (t_bench, i_type)
        return None
    print "{0}({1}) launched at: {2}".format(instance, reservation.id, reservation.launch_time)

    return instance

def main():
    # Start all the benchmark at once will most likely exceeds the quota limit per user
    # Better to execute the benchmark on a category to category basis
    conn = boto.ec2.connect_to_region(region)

    flag = False
    while 0 < len(instances) and not flag:
        for i in instances:
            res = launch_benchmark(conn, i)
            if res is not None and not res in completed:
                completed.append(res)
            time.sleep(2)
            flag = True
            break
        for i in completed:
            if i in instances:
                instances.remove(i)
        for i in instances:
            print '%s is waiting for launch' % i
        time.sleep(60*5)

if __name__ == "__main__":
    main()

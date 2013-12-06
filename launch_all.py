#!/usr/bin/python
# -*- coding: utf-8 -*-
import base64
import boto.ec2
import sys
import time

# Amazon Linux AMI 2013.09.1 [us-east-1]
paravirtual_ami = 'ami-83e4bcea'
# Amazon Linux AMI (HVM) 2013.09.1 [us-east-1]
hvm_ami = 'ami-d1bfe4b8'

# List of instance types to be benchmarked
# m3.xlarge and m3.2xlarge instances have 2 different virtualization types (Paravirtual or HVM)
# m3.xlarge, m3.2xlarge, m1.large, m1.xlarge, c3.xlarge, c3.2xlarge, c3.4xlarge, c1.xlarge, g2.2xlarge, m2.2xlarge, m2.4xlarge can have EBS optimization with provisioned IOPS
paravirtual = ['t1.micro', 'm1.small', 'm1.medium',
               'm1.large', 'm1.xlarge', 'm3.xlarge',
               'm3.2xlarge', 'm2.xlarge', 'm2.2xlarge',
               'm2.4xlarge', 'c1.medium', 'c1.xlarge']
hvm = ['m3.xlarge', 'm3.2xlarge', 'hi1.4xlarge',
       'hs1.8xlarge', 'c3.large', 'c3.xlarge', 'c3.2xlarge',
       'c3.4xlarge', 'c3.8xlarge', 'cc1.4xlarge', 'cg1.4xlarge',
       'cc2.8xlarge', 'cr1.8xlarge', 'g2.2xlarge']
paravirtual_ebs = ['m1.large', 'm1.xlarge', 'm3.xlarge',
                   'm3.2xlarge', 'm2.2xlarge', 'm2.4xlarge',
                   'c1.xlarge']
hvm_ebs = ['m3.xlarge', 'm3.2xlarge', 'c3.xlarge',
           'c3.2xlarge', 'c3.4xlarge', 'g2.2xlarge']

instance_types = {1: paravirtual, 2: hvm, 3: paravirtual_ebs, 4: hvm_ebs}
virt_types = {'paravirtual': 1, 'hvm': 2, 'paravirtual_ebsOptimized': 3, 'hvm_ebsOptimized': 4}
ebs_types = {'paravirtual': False, 'hvm': False, 'paravirtual_ebsOptimized': True, 'hvm_ebsOptimized': True}
amis = {'paravirtual': paravirtual_ami, 'hvm': hvm_ami, 'paravirtual_ebsOptimized': paravirtual_ami, 'hvm_ebsOptimized': hvm_ami}

# Confirm ~/.boto exists and contains credentials
region = 'us-east-1'
k_name = 'iomz@cisco-macbook'
s_grp = 'quick-start-1'

def launch_benchmark(conn, t_bench, u_data):
    if t_bench=='test':
        ami = paravirtual_ami
        i_types = ['t1.micro']
        ebs = False
    else:
        ami = amis[t_bench]
        i_types =  instance_types[virt_types[t_bench]]
        ebs =  ebs_types[t_bench]

    for i_type in i_types:
        try:
            reservation = conn.run_instances(
                ami,
                instance_type=i_type,
                key_name=k_name,
                max_count=1,
                security_groups=[s_grp],
                user_data=u_data,
                ebs_optimized=ebs
                ).instances[0]
        except:
            print "%s_%s launch failed" % (t_bench, i_type)
            continue
        print "{0}_{1}({2}) launched at: {3}".format(t_bench, i_type, reservation.id, reservation.launch_time)
        time.sleep(2)

    return None


def show_help(v_id = ""):
    if v_id:
        print "Invalid virtualization type: %s" % v_id
    print "Usage: %s <paravirtual|hvm|paravirtual_ebsOptimized|hvm_ebsOptimized> [user script]" % sys.argv[0]
    sys.exit(1)


def main():
    # Start all the benchmark at once will most likely exceeds the quota limit per user
    # Better to execute the benchmark on a category to category basis
    conn = boto.ec2.connect_to_region(region)
    if len(sys.argv) == 3:
        try:
            u_data = base64.b64encode(open(sys.argv[2],'r').read())
        except:
            print "User script error: %s couldn't be opend." % sys.argv[2]
            show_help()
    elif len(sys.argv) != 2:
        u_data = base64.b64encode(open('initbench_unix.sh','r').read())
    else:
        show_help()

    v_key = sys.argv[1]
    if not v_key in virt_types and v_key != 'test':
        show_help(v_key)
    else:
        launch_benchmark(conn, v_key, u_data)
    ## Paravirtual
    #launch_benchmark(conn, 'paravirtual')
    ## HVM
    #launch_benchmark(conn, 'hvm')
    ## Paravirtual-EbsOptimized
    #launch_benchmark(conn, 'paravirtual_ebsOptimized')
    ## HVM-EbsOptimized
    #launch_benchmark(conn, 'hvm_ebsOptimized')
    return None


if __name__ == "__main__":
    main()

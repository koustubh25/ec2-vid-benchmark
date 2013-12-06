#!/usr/bin/python
# -*- coding: utf-8 -*-
import base64
import boto.ec2
import sys
import time
import argparse

# Confirm ~/.boto exists and contains credentials
region = 'us-east-1'

def changeAtt(conn, user_data):
    print '### Looking up all the instances...'
    instances = conn.get_only_instances()
    print "### Changing the userdata script to %s..." % user_data
    user_data = base64.b64encode(open(user_data,'r').read())
    for i in instances:
        res = conn.modify_instance_attribute(instance_id=i.id, attribute='userData', value=user_data)
        print "Instance: %s changed" % i.id if res else "Instance: %s not changed" % i.id

def startInstances(conn):
    print '### Looking up all the instances...'
    instances = conn.get_only_instances()
    print "%d instances found on the account" % len(instances)
    i_arr = []
    for i in instances:
       i_arr.append(i.id) 
    i_starteds = conn.instances(instance_ids=i_arr)
    for i in i_starteds:
        print "Instance: %s started" % i
    for i in set(i_arr)-set(i_starteds):
        print "Instance: %s not started" % i

def main():
    parser = argparse.ArgumentParser(prog='mass_control.py',
            description='Control all the running ec2 instances on ec2')
    parser.add_argument('cmd', nargs=1, help='[start|change]')
    parser.add_argument('-u', '--user-data', nargs=1, help='specify a new userdata script file')
    args = parser.parse_args()
    cmd = vars(args)['cmd'][0]

    conn = boto.ec2.connect_to_region(region)

    if cmd != 'start' and cmd != 'change':
        sys.exit(0)
    elif cmd == 'change':
        changeAtt(conn, vars(args)['user_data'][0])
    elif cmd == 'start':
        startInstances(conn)

if __name__ == "__main__":
    main()

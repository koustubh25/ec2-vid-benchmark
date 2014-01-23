#!/usr/bin/python
# -*- coding: utf-8 -*-
from boto.dynamodb2.table import Table
from boto.exception import JSONResponseError
import sys
import time

# Lists of instance types
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
        if instance_logs.delete():
            print "- %s deleted" % instance_name
    except JSONResponseError:
        print "# %s untouched" % instance_name
    # Cool down
    time.sleep(2)

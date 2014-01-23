#!/usr/bin/python
# -*- coding: utf-8 -*-
try:
    from boto.dynamodb2.fields import HashKey, RangeKey
    from boto.dynamodb2.table import Table
    from boto.exception import JSONResponseError
except ImportError:
    sys.exit()

instance_name = open('/var/local/instance_name').read().strip()
# Check if the table exists or not, create one if not
try:
    logs = Table(instance_name, schema=[HashKey('trial'),RangeKey('parallel'),])
    tmp = logs.describe()
except JSONResponseError:
    logs = Table.create(instance_name, schema=[HashKey('trial'),RangeKey('parallel'),])

print 'boto'

from boto.dynamodb2.exceptions import ValidationException
from boto.dynamodb2.fields import HashKey, RangeKey
from boto.dynamodb2.table import Table
from boto.exception import JSONResponseError
from time import sleep
import json

Tests = [
    "Dhrystone 2 using register variables",
    "Double-Precision Whetstone",
    "Execl Throughput",
    "File Copy 1024 bufsize 2000 maxblocks",
    "File Copy 256 bufsize 500 maxblocks",
    "File Copy 4096 bufsize 8000 maxblocks",
    "Pipe Throughput",
    "Pipe-based Context Switching",
    "Process Creation",
    "Shell Scripts (1 concurrent)",
    "Shell Scripts (8 concurrent)",
    "System Call Overhead",
    "System Benchmarks Index Score"
]

rackspace_list = json.load(open("../Rackspace_instances.json","r"))['Servers']
for i in rackspace_list:
    name = i['Instance Name']
    print "Deleteing %s" % name

    #s = name.split('_')
    #if 'Instance' in name: # Standard
    #    itype = s[0].lower() + '_' + s[1].lower()
    #else: # Performance
    #    itype = s[0] + "gb_" + s[2].lower()
    #virt = 'paravirtual'
    #new_name = itype + '_' + virt
    
    table_struct = None
    try:
        logs = Table(name, schema=[HashKey('trial'),RangeKey('parallel'),])
        table_struct = logs.describe()
        logs.delete()
    except JSONResponseError:
        print "%s not existing" % name
        sleep(5)

    #table_struct = None
    #try:
    #    new_logs = Table(new_name, schema=[HashKey('trial'),RangeKey('parallel'),])
    #    table_struct = new_logs.describe()
    #except JSONResponseError:
    #    new_logs = Table.create(new_name, schema=[HashKey('trial'),RangeKey('parallel'),])
    #    sleep(5)
    #while table_struct is None:
    #    try:
    #        new_logs = Table(new_name, schema=[HashKey('trial'),RangeKey('parallel'),])
    #        table_struct = new_logs.describe()
    #    except JSONResponseError:
    #        sleep(5)

    #print "%s -> %s" % (name, new_name)
    #for item in logs.scan():
    #    new_item = {}
    #    new_item['trial'] = item['trial']
    #    new_item['parallel'] = item['parallel']
    #    for t in Tests:
    #        new_item[t] = item[t]

    #    while True:
    #        try:
    #            new_logs.put_item(new_item, overwrite=True)
    #            break
    #        except ValidationException:
    #            print new_name, new_item['trial'], new_item['parallel']
    #        except JSONResponseError:
    #            print "Waiting for the table to be active"
    #            sleep(5)
                

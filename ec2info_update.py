#!/usr/bin/python
# -*- coding: utf-8 -*-
from boto.dynamodb2.fields import HashKey
from boto.dynamodb2.table import Table
from boto.dynamodb2.exceptions import ConditionalCheckFailedException
from boto.exception import JSONResponseError
from HTMLParser import HTMLParser
from pprint import pprint
import json
import sys
import time
import urllib

# Retrieve instance types' detail
class InstanceParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.in_td = False
        self.in_tr = False
        self.in_b = False
        self.in_span = False
        self.info = False
        self.tmp = ''
        self.ins = []
        self.arr = []

    def handle_starttag(self, tag, attrs):
        if tag == 'td':
            self.in_td = True
            self.tmp = ''
        elif tag == 'tr':
            self.in_tr = True
            self.info = True
            self.ins = []
        elif tag == 'b':
            self.in_b = True
        elif tag == 'span':
            self.in_span = True

    def handle_data(self, data):
        if self.in_tr and self.in_td and self.in_b and 0 < len(data.strip()) and self.info and not self.in_span:
            self.tmp += ' ' + data.strip()

    def handle_endtag(self, tag):
        if tag == 'td':
            self.in_span = False
            self.ins.append(self.tmp.strip())
        elif tag == 'tr':
            self.in_tr = False
            self.info = False
            if 0 < len(self.ins):
                self.arr.append(self.ins)
            self.ins = []
        elif tag == 'b':
            self.in_b == False
        elif tag == 'span':
            self.in_span = False
        elif tag == 'table':
            self.reset()

# Retrieve instance virtualization type information
class VirtTypeParser(HTMLParser):
    def __init__(self):
        HTMLParser.__init__(self)
        self.in_table = False
        self.in_strong = False
        self.in_td = False
        self.in_tr = False
        self.in_b = False
        self.in_span = False
        self.tmp = ''
        self.v_names = []
        self.v_types = {}
        self.i_type = ''
        self.i_index = 0

    def handle_starttag(self, tag, attrs):
        if tag == 'table':
            self.in_table = True
        elif tag == 'strong':
            self.in_strong = True
            self.tmp = ''
        elif tag == 'td':
            self.in_td = True
        elif tag == 'tr':
            self.in_tr = True
            self.i_index = 0
            self.i_type = ''
        elif tag == 'b':
            self.in_b = True
        elif tag == 'span':
            self.in_span = True

    def handle_data(self, data):
        if self.in_table and self.in_tr and self.in_td and self.in_strong:
            self.tmp += data.strip()
        elif self.in_table and self.in_tr and self.in_td and self.i_type == '' and not self.in_strong:
            self.i_type = data.strip()
            if 0 < len(self.i_type):
                self.v_types[self.i_type] = []
        elif self.in_table and self.in_tr and self.in_td and not self.in_strong:
            if data.strip() == "check":
                v_type = self.check_virt_type(self.i_index)
                if v_type is not None and not v_type in self.v_types[self.i_type]:
                    self.v_types[self.i_type].append(v_type)

    def handle_endtag(self, tag):
        if tag == 'td':
            self.i_index += 1
            self.in_span = False
        elif tag == 'strong':
            self.in_strong = False
            if 0 < len(self.tmp):
                self.v_names.append(self.tmp)
        elif tag == 'tr':
            self.in_tr = False
        elif tag == 'b':
            self.in_b == False
        elif tag == 'span':
            self.in_span = False
        elif tag == 'table':
            self.reset()

    def check_virt_type(self, index):
        v_name = self.v_names[index]
        if 'PV' in v_name and 'EBS' in v_name and '64' in v_name:
            return 'paravirtual'
        elif 'HVM' in v_name and 'EBS' in v_name and '64' in v_name:
            return 'hvm'
        return None

    def get_virt_types(self, i_type):
        try:
            virt_types = self.v_types[i_type]
        # Some types not in the list of recommended virtualization type for Amazon Linux
        except KeyError:
            #if i_type in [m3.medium, m3.large]:
            #    virt_types = ['paravirtual','hvm'] # The two are available in both paravirtual and hvm
            virt_types = None
        return virt_types

def main():
    # Parse us-east linux instance prices for each gens
    sys.stdout.write("*** Retrieving base price information for on-demand linux instances...")
    linux_od = "http://aws.amazon.com/ec2/pricing/json/linux-od.json"
    base_prices = {}
    price_dict = json.load(urllib.urlopen(linux_od))['config']['regions'][0]['instanceTypes']
    for gen in price_dict:
        for size in gen['sizes']:
            base_prices[size['size']] = size['valueColumns'][0]['prices']['USD']
    print "\tDone"
            
    # Parse us-east linux ebs prices for each gens
    sys.stdout.write("*** Retrieving EBS optimization price information...")
    pricing_ebs = "http://aws.amazon.com/ec2/pricing/pricing-ebs-optimized-instances.json"
    ebs_prices = {}
    ebs_dict = json.load(urllib.urlopen(pricing_ebs))['config']['regions'][0]['instanceTypes']
    for gen in ebs_dict:
        for size in gen['sizes']:
            ebs_prices[size['size']] = size['valueColumns'][0]['prices']['USD']
    print "\tDone"

    # Retrieve instance type information
    sys.stdout.write("*** Retrieving EC2 instance detail information...")
    types = "http://aws.amazon.com/ec2/instance-types/"
    parser = InstanceParser()
    try:
        parser.feed(urllib.urlopen(types).read())
    except AssertionError:
        pass
    instance_types = parser.arr
    cat = instance_types.pop(0)
    print "\tDone"
    
    # Retrieve virtualization type information
    sys.stdout.write("*** Retrieving instance virtualization type availability for Amazon Linux AMI...")
    types = "http://aws.amazon.com/amazon-linux-ami/instance-type-matrix/"
    vtp = VirtTypeParser()
    try:
        # Replacing 'check' necessary to detect the special character
        vtp.feed(urllib.urlopen(types).read().replace("&#x2713;", 'check'))
    except AssertionError:
        pass
    print "\tDone"
    
    # Check if the table exists or not, create one if not
    print "*** Connecting to DynamoDB 'ec2_instances' table..."
    table_struct = None
    try:
        ec2_instances = Table('ec2_instances', schema=[HashKey('Instance Name'),])
        table_struct = ec2_instances.describe()
    except JSONResponseError:
        ec2_instances = Table.create('ec2_instances', schema=[HashKey('Instance Name'),])
        sys.stdout.write("*** DynamoDB is creating a new table...")
    while table_struct is None:
        try:
            ec2_instances = Table('ec2_instances', schema=[HashKey('Instance Name'),])
            table_struct = ec2_instances.describe()
            print "\tDone"
        except JSONResponseError:
            time.sleep(5)
    
    # Iterate all the instance combinations
    for i in instance_types:
        virt_types = vtp.get_virt_types(i[1])
        # Check if the instance is available in the lists
        if virt_types is None or i[1] not in base_prices or (i[7] =='Yes' and i[1] not in ebs_prices):
            print '- %s not updated' % i[1]
            continue
        for vt in virt_types:
            ec2_prices = {}
            if i[7] == 'Yes':
                ec2_prices[i[1] + '_' + vt] = base_prices[i[1]]
                ec2_prices[i[1] + '_' + vt + '_ebsOptimized'] = "%.3f" % (float(base_prices[i[1]]) + float(ebs_prices[i[1]]))
            else:
                ec2_prices[i[1] + '_' + vt] = base_prices[i[1]]

            for instance_name, price in ec2_prices.iteritems():
                instance = {
                    cat[1]: i[1], # Instance Type 
                    cat[0]: i[0], # Instance Family
                    cat[2]: i[2], # Processor Arch
                    cat[3]: i[3], # vCPU
                    cat[4]: i[4], # ECU
                    cat[5]: i[5], # Memory (GiB)
                    cat[6]: i[6], # Instance Storage (GB)
                    cat[7]: i[7], # EBS-optimized Available 
                    cat[8]: i[8], # Network Performance
                    'Price': price,
                    'Instance Name': instance_name
                }
                if ec2_instances.has_item(**{'Instance Name': instance_name}):
                    print "# %s already exists in the table" % instance_name
                    continue
                try:
                    ec2_instances.put_item(data=instance, overwrite=True)
                    print "+ %s updated" % instance_name
                except ConditionalCheckFailedException:
                    print "- %s not updated" % instance_name
    print "\n*** 'ec2-instances' table is now fully updated!"

if __name__ == "__main__":
    main()

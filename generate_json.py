#!/usr/bin/python
from boto.dynamodb2.fields import HashKey, RangeKey
from boto.dynamodb2.table import Table
from boto.dynamodb2.exceptions import ConditionalCheckFailedException
from boto.exception import JSONResponseError
from math import sqrt
from pprint import pprint
from time import sleep
import json
import simplejson as js
import sys

Tests = [
    "dhrystone",
    "double",
    "execl",
    "file1024",
    "file256",
    "file4096",
    "pipethru",
    "pipecs",
    "process",
    "shell1",
    "shell8",
    "overhead",
    "index"
]

TestNames = [
    "Dhrystone 2 using register variables",  # dhrystone
    "Double-Precision Whetstone",            # double
    "Execl Throughput",                      # execl
    "File Copy 1024 bufsize 2000 maxblocks", # file1024
    "File Copy 256 bufsize 500 maxblocks",   # file256
    "File Copy 4096 bufsize 8000 maxblocks", # file4096
    "Pipe Throughput",                       # pipethru
    "Pipe-based Context Switching",          # pipecs
    "Process Creation",                      # process
    "Shell Scripts (1 concurrent)",          # shell1
    "Shell Scripts (8 concurrent)",          # shell8
    "System Call Overhead",                  # overhead
    "System Benchmarks Index Score"          # index
]

TRIAL = 5

def parse_log(log):
    if "multi" in log:
        parallel = ["single", "multi"]
    else:
        parallel = ["single"]

    log_dict = {}

    for p in parallel:
        for t in range(0,len(TestNames)):
            d_sum = 0
            d_arr = []
            for i in range(0,TRIAL):
                val = log[p][i][Tests[t]]
                d_sum += val
                d_arr.append(val)
            mean = d_sum/len(d_arr)
            sqsum = 0
            for i in d_arr:
                sqsum += (i - mean)*(i - mean)
            sd = sqrt(sqsum/(len(d_arr)))
            if p not in log_dict:
                log_dict[p] = {}
            log_dict[p][Tests[t]] = {"mean": mean, "sd": sd}

    return log_dict

def main():
    if len(sys.argv) == 2:
        # Retrieve instance information
        try:
            instances_dict = json.load(open("web/data/instances.json", "r"))
        except IOError:
            print "*** web/data/instances.json not found! Try ./update_instances.py first! ***"
            sys.exit(1)

        if sys.argv[1] == 'unixbench':
            logs = []
            for instance_name in instances_dict.keys():
                log_raw = {}
                try:
                    instance_logs = Table(instance_name)
                    for l in instance_logs.scan():
                        for t in range(0,len(TestNames)):
                            if l['parallel'] not in log_raw:
                                log_raw[l['parallel']] = {}
                            if int(l['trial']) not in log_raw[l['parallel']]:
                                log_raw[l['parallel']][int(l['trial'])] = {}
                            log_raw[l['parallel']][int(l['trial'])][Tests[t]] = float(l[TestNames[t]])
                except JSONResponseError:
                    print "No log was found for %s" % instance_name
                    sys.exit(1)

                #pprint(log_raw)
                #logs[instance_name] = parse_log(log_raw)
                log_dict = parse_log(log_raw)
                for p in log_dict.keys():
                    for t in log_dict[p].keys():
                        log = {}
                        log['name'] = instance_name
                        log['parallel'] = p
                        log['test'] = t
                        log['mean'] = log_dict[p][t]['mean']
                        log['sd'] = log_dict[p][t]['sd']
                        log['cloud'] = instances_dict[instance_name]['cloud']
                        log['price'] = instances_dict[instance_name]['price']
                        log['priceRatio'] = log['mean']/(100*log['price'])

                        logs.append(log)

            with open('web/data/unixbench.json', 'w') as outfile:
                js.dump(logs, fp=outfile, indent=4*' ')
        elif sys.argv[1] == 'group':
            try:
                logs = json.load(open("web/data/unixbench.json", "r"))
            except IOError:
                print "*** web/data/unixbench.json not found! Create one with %s unixbench ***" % sys.argv[0]
                sys.exit(1)
            sizes = []
            types = []
            families = []
            for v in instances_dict.values():
                if v['size'] not in sizes:
                    sizes.append(v['size'])
                elif v['type'] not in types:
                    types.append(v['type'])
                elif v['family'] not in families:
                    families.append(v['family'])
            for g in ['size','type','family']:
                for t in Tests:
                    for p in ['single', 'multi']:
                        index_dict = {}
                        if g=='size':
                            groups = sizes
                        elif g=='type':
                            groups = types
                        elif g=='family':
                            groups = families
                        else:
                            groups = []
                        for gs in groups:
                            means = []
                            msum = 0
                            cloud = ''
                            for l in logs:
                                if l['test'] == t and instances_dict[l['name']][g] == gs and l['parallel'] == p:
                                    means.append(l['mean'])
                                    msum += l['mean']
                                    cloud = instances_dict[l['name']]['cloud']
                            if len(means) == 0:
                                index_dict[gs] = {'mean':0, 'min':0, 'max':0, 'num':0, 'cloud':cloud, 'parallel':p}
                                continue
                            mean = msum/len(means)
                            if len(means) == 1:
                                index_dict[gs] = {'mean':mean, 'min':mean, 'max':mean, 'num':1, 'cloud':cloud, 'parallel':p}
                                continue
                            mmin = min(means)
                            mmax = max(means)
                            index_dict[gs] = {'mean':mean, 'min':mmin, 'max':mmax, 'num':len(means), 'cloud':cloud, 'parallel':p}
                        with open('web/data/ub_'+g+'_'+t+'.json', 'w') as outfile:
                            js.dump(index_dict, fp=outfile, indent=4*' ')
        else:
            print "usage: %s [unixbench|group]" % sys.argv[0]
    else:
        print "usage: %s [unixbench|group]" % sys.argv[0]

if __name__ == "__main__":
    main()

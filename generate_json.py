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

TestsAbbr = [
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

TRIAL = 5

def parse_log(log):
    if "multi" in log:
        parallel = ["single", "multi"]
    else:
        parallel = ["single"]

    logdict = {}

    for p in parallel:
        for t in range(0,len(Tests)):
            d_sum = 0
            d_arr = []
            for i in range(0,TRIAL):
                val = log[p][i][TestsAbbr[t]]
                d_sum += val
                d_arr.append(val)
            mean = d_sum/len(d_arr)
            variance_sum = 0
            for i in d_arr:
                variance_sum += (i - mean)*(i - mean)
            sd = sqrt(variance_sum/(len(d_arr)))
            if p not in logdict:
                logdict[p] = {}
            logdict[p][Tests[t]] = {"Mean": mean, "SD": sd}

    return logdict

def main():
    if 1 < len(sys.argv):
        if sys.argv[1] == 'unixbench':
            logs = {}

            # Retrieve instance information
            try:
                instances_dict = json.load(open("web/data/instances.json", "r"))
            except IOError:
                print "*** web/data/instances.json not found! Try ./update_instances.py ***"
                sys.exit(1)

            for instance_name in instances_dict.keys():
                log_raw = {}
                try:
                    instance_logs = Table(instance_name)
                    for l in instance_logs.scan():
                        for t in range(0,len(Tests)):
                            if l['parallel'] not in log_raw:
                                log_raw[l['parallel']] = {}
                            if int(l['trial']) not in log_raw[l['parallel']]:
                                log_raw[l['parallel']][int(l['trial'])] = {}
                            log_raw[l['parallel']][int(l['trial'])][TestsAbbr[t]] = float(l[Tests[t]])
                except JSONResponseError:
                    print "No log was found for %s" % instance_name
                    sys.exit(1)

                #pprint(log_raw)
                logs[instance_name] = parse_log(log_raw)

            with open('web/data/unixbench.json', 'w') as outfile:
                js.dump(logs, fp=outfile, indent=4*' ')
        elif sys.argv[1] == "unit":
            units_dict = {}
            try:
                units = Table("unixbench_unit")
                for u in units.scan():
                    units_dict[u['test_name']] = u['unit']
            except JSONResponseError:
                print "unixbench_unit table not found"

            with open('web/data/unixbench_unit.json', 'w') as outfile:
                js.dump(units_dict, fp=outfile, indent=4*' ')
        else:
            print "usage: %s [unixbench|unit]" % sys.argv[0]
    else:
        print "usage: %s [unixbench|unit]" % sys.argv[0]

if __name__ == "__main__":
    main()

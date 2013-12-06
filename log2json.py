#!/usr/bin/python
from os import listdir
from os.path import isfile, join, dirname, realpath
import re
from datetime import timedelta
import simplejson as js
import csv

path = dirname(realpath(__file__)) + "/logs"
files = [ f for f in listdir(path) if isfile(join(path,f)) ]
logs = {}
types = {}

for row in csv.DictReader(open("instance_info.csv", 'rb'), dialect='excel'):
    i_type = row['Instance Type']
    #print i_type
    types[i_type] = {}
    types[i_type]['vcpu'] = int(row['vCPU'])
    types[i_type]['ecu'] = float(row['ECU'])
    types[i_type]['memory'] = float(row['Memory (GiB)'])
    types[i_type]['network'] = row['Network Performance']
    types[i_type]['price'] = float(row['Price'])

for f in files:
    m = re.match(r"^(\w+_\w+\.[0-9a-z]+(_EbsOptimized)?)[\._12]+", f)
    if m is None:
        continue
    i_type = m.group(1).split('_')[1]
    t_bench = m.group(1)
    fp = path + '/' + f
    if t_bench not in logs:
        logs[t_bench] = {}

    # time log file
    if 'unixbench.log' in f:
        lf =  open(fp, 'r')
        ll = list(lf)
        lf.close()
        for line in ll:
            m = re.match(r"System Benchmarks Index Score\s+(\d+\.\d+)", line)
            if m is not None:
                #print f, m.group()
                break
        # Load instance information
        logs[t_bench]['score_single'] = float(m.group(1))

        ll.reverse() # For multicore result score
        for line in ll:
            m = re.match(r"System Benchmarks Index Score\s+(\d+\.\d+)", line)
            if m is not None:
                #print f, m.group()
                break
           
        # Load instance information
        logs[t_bench]['score'] = float(m.group(1))

    elif '.log' in f:
        #print i_type
        lf =  open(fp, 'r')
        m = re.match(r"^(?P<user>\d+\.\d*)user\ (?P<system>\d+\.\d*)system\ (?P<elapsed>[\d|\.|:]*)elapsed\ (?P<cpu>\d+)\%", lf.readline())
        lf.close()

        # Load instance information
        logs[t_bench]['vcpu'] = types[i_type]['vcpu']
        logs[t_bench]['ecu'] = types[i_type]['ecu']
        logs[t_bench]['memory'] = types[i_type]['memory']
        logs[t_bench]['network'] = types[i_type]['network']
        logs[t_bench]['price'] = types[i_type]['price']

        logs[t_bench]['user'] = m.group("user")
        logs[t_bench]['system'] = m.group("system")
        logs[t_bench]['cpu'] = m.group("cpu")
        m_time = re.match(r"(\d+):(\d+)([\.:])(\d+)", m.group("elapsed"))
        try:
            if m_time.group(3) == ':': # hh:mm:ss format
                h, m, s = [ int(i) for i in m_time.group(1,2,4) ]
            if m_time.group(3) == '.': # mm:ss.msms formart
                h = 0
                m, s = [ int(i) for i in m_time.group(1,2) ]
        except:
            h, m, s = 0, 0, 0
        logs[t_bench]['elapsed'] = str(timedelta(seconds=s, minutes=m, hours=h).seconds)

    elif '_1.out' in f:
        lf = open(fp, 'r')
        lst = lf.readlines()
        lf.close()
        m = re.match(r"^.+frames, (\d+\.\d+)\ fps, (\d+.\d+) kb/s", lst[len(lst)-1])
        logs[t_bench]['p1fps'], logs[t_bench]['p1kbs'] = m.group(1,2)

    elif '_2.out' in f:
        lf = open(fp, 'r')
        lst = lf.readlines()
        lf.close()
        m = re.match(r"^.+frames, (\d+\.\d+)\ fps, (\d+.\d+) kb/s", lst[len(lst)-1])
        logs[t_bench]['p2fps'], logs[t_bench]['p2kbs'] = m.group(1,2)

    #elif '.stats' in f:

print js.dumps(logs, indent=4*' ')

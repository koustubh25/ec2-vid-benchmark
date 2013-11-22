#!/bin/sh
cat Instances.json| jq '[.Benchmarks[].Instances[0] | {InstanceType, VirtualizationType, EbsOptimized}]'

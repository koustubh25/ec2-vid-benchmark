#!/bin/sh
cat Instances.json| jq '.Benchmarks[].Instances[].InstanceType'

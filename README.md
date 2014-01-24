ec2-vid-benchmark
=================

Benchmark script of AWS EC2 instances for video processing performance

Features
----
* Perform UnixBench on all the EC2 insctances
* Parse and store the results into DynamoDB
* Plot the results in HTML5

Start UnixBench
----

    $ git clone https://github.com/iomz/ec2-vid-benchmark.git
    $ cd ec2-vid-benchmark/unixbench
    $ run_ec2_benchmark.py --update-instance-list

TODOs
----
* Launch scripts
    * Automated configuration setup (Interactive?)
    * Argument parsing in unixbench/upload_log.py

* Web graphs
    * Query to NoSQL and dynamical update
    * Automatical deployment

* Documentation
    * Summary for the results
    * Usage

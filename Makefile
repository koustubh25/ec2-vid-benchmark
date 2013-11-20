all: 
	tar zcvf bench.tgz benchmark last_x264.tar.bz2 libav-HEAD-*.tar.gz startbench.sh Makefile .s3cfg .aws
	aws s3 cp bench.tgz s3://iomz-benchmark/
	aws s3 cp initbench.sh s3://iomz-benchmark/
	s3cmd setacl --acl-public s3://iomz-benchmark/bench.tgz
	s3cmd setacl --acl-public s3://iomz-benchmark/initbench.sh

.PHONY: init
init:
	tar zcvf bench.tgz benchmark/launchbenchmark.sh last_x264.tar.bz2 libav-HEAD-*.tar.gz startbench.sh Makefile .s3cfg .aws
	aws s3 cp bench.tgz s3://iomz-benchmark/
	aws s3 cp initbench.sh s3://iomz-benchmark/
	s3cmd setacl --acl-public s3://iomz-benchmark/bench.tgz
	s3cmd setacl --acl-public s3://iomz-benchmark/initbench.sh

.PHONY: clean
clean:
	rm -fr libav-HEAD*/ x264-snapshot-*/ bench.tgz benchmark/bench* benchmark/*.tgz benchmark/logs InstanceDesc

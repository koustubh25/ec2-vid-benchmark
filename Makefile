all:
	
.PHONY: x264
x264:
	tar zcvf x264bench.tgz x264bench/launchbenchmark.sh x264bench/elephantsdream_source.264 last_x264.tar.bz2 libav-HEAD-*.tar.gz x264bench.sh Makefile .s3cfg .aws
	aws s3 cp x264bench.tgz s3://iomz-benchmark/
	s3cmd setacl --acl-public s3://iomz-benchmark/x264bench.tgz

.PHONY: unix
unix:
	tar zcvf unixbench.tgz unixbench.sh .aws
	aws s3 cp unixbench.tgz s3://iomz-benchmark/
	s3cmd setacl --acl-public s3://iomz-benchmark/unixbench.tgz
	rm unixbench.tgz

.PHONY: clean
clean:
	rm -f unixbench.tgz

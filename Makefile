all:
	tar zcvf unixbench.tgz unixbench.sh .boto boto_check.py upload_log.py
	aws s3 cp unixbench.tgz s3://iomz-benchmark/
	s3cmd setacl --acl-public s3://iomz-benchmark/unixbench.tgz
	rm unixbench.tgz

.PHONY: clean
clean:
	rm -f unixbench.tgz

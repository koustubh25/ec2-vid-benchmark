all:
	for file in *.html; do scp "$$file" vcg:/var/www/cloud-eval/unixbench/; done
	scp script/unixbench-visualizer.js vcg:/var/www/cloud-eval/unixbench/script/
	#scp style.css vcg:/var/www/cloud-eval/unixbench/

.PHONY: data
data:
	for file in data/*.json; do scp "$$file" vcg:/var/www/cloud-eval/unixbench/data/; done

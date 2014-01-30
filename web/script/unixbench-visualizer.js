/*
 unixbench-visualizer.js v0.1 (2014-01-29)

 (c)2013-2014 Iori Mizutani(iomz@cisco.com)

 License: https://github.com/iomz/ec2-vid-benchmark/LICENSE

 Parse unixbench result json file to TAFFY DB and plot the figure with Highcharts.js
 */

var instances = TAFFY();
var logs = TAFFY();
var index = TAFFY();

Specs = [
    "type",
    "family",
    "cloud",
    "virt",
    "ebs",
    "vcpu",
    "memory",
    "price",
    "storage",
    "ecu",
    "network"
]

SpecNames = [
    "Instance Type",
    "Instance Family",
    "Cloud",
    "Virtualization Type",
    "EBS-optimized",
    "vCPU",
    "Memory (GiB)",
    "Price ($/Hr)",
    "Instance Storage (GB)",
    "ECU",
    "Network Performance"
]

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
    "Dhrystone 2 using register variables",  // dhrystone
    "Double-Precision Whetstone",            // double
    "Execl Throughput",                      // execl
    "File Copy 1024 bufsize 2000 maxblocks", // file1024
    "File Copy 256 bufsize 500 maxblocks",   // file256
    "File Copy 4096 bufsize 8000 maxblocks", // file4096
    "Pipe Throughput",                       // pipethru
    "Pipe-based Context Switching",          // pipecs
    "Process Creation",                      // process
    "Shell Scripts (1 concurrent)",          // shell1
    "Shell Scripts (8 concurrent)",          // shell8
    "System Call Overhead",                  // overhead
    "System Benchmarks Index Score"          // index
]

function getType(name) {
	var arr = [];
	var desc = name.split('_');
	arr.push(desc[0]);
	arr.push(desc[1]);
	if (desc.length == 3) {
		arr.push(true);
	} else {
		arr.push(false);
	}
	return arr;
}

function drawLineGraph(el, title, subtitle, categories, yaxis, tooltipVal, series) {
	$(el).highcharts({
		title : {
			text : title,
			x : -20 //center
		},
		subtitle : {
			text : subtitle,
			x : -20
		},
		xAxis : {
			categories : categories,
			labels : {
				rotation : 73
			}
		},
		yAxis : {
			title : {
				text : yaxis
			},
			plotLines : [{
				value : 0,
				width : 1,
				color : "#808080"
			}]
		},
		tooltip : {
			valueSuffix : tooltipVal
		},
		legend : {
			layout : "vertical",
			align : "right",
			verticalAlign : "middle",
			borderWidth : 0
		},
		series : series
	});
}

$(function() {
	$.getJSON("data/instances.json", function(d) {
		$.each(d, function(k, v) {
            instances.insert(v);
		});
	});

	// getJSON for instances.json

    /*
	$('#unix_single').highcharts({
		chart : {
			type : 'column',
			margin : [50, 50, 100, 80]
		},
		title : {
			text : "UnixBench Index Score (per single core)"
		},
		xAxis : {
			categories : unix_cat,
			labels : {
				rotation : 55
			}
		},
		yAxis : {
			title : {
				text : "UnixBench score"
			},
			subtitle : {
				text : 'Paravirtual / HVM'
			}
		},
		legend : {
			enabled : false
		},
		tooltip : {
			headerFormat : '<span style="font-size:10px">{point.key}</span><table>',
			pointFormat : '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' + '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
			footerFormat : '</table>',
			shared : true,
			useHTML : true
		},
		plotOptions : {
			column : {
				pointPadding : 0.2,
				borderWidth : 0
			}
		},
		series : [{
			name : 'UnixBench score (Paravirtual)',
			data : unix_paravirtual_single
		}, {
			name : 'UnixBench score (HVM)',
			data : unix_hvm_single
		}]
	});
    */
	$.getJSON("data/unixbench.json", function(d) {
		$.each(d, function(k, v) {
            logs.insert(v);
		});
	});
	//getJSON for unixbench.json
    
    //logs({test:'index', parallel:'single'}).order('mean').map(function(i){return i.name;})
});

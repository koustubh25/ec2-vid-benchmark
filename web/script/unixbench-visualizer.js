/*
 unixbench-visualizer.js v0.1 (2014-01-29)

 (c)2013-2014 Iori Mizutani(iomz@cisco.com)

 License: https://github.com/iomz/ec2-vid-benchmark/LICENSE

 Parse unixbench result json file to TAFFY DB and plot the figure with Highcharts.js
 */

var instances = TAFFY();
var logs = TAFFY();
var table = TAFFY();
var colors = ['#4572A7', '#AA4643', '#89A54E', '#80699B', '#3D96AE', '#DB843D', '#92A8CD', '#A47D7C', '#B5CA92'];
var Parallels = ['Single', 'Multi'];
var Groups = ['size', 'type', 'family'];
var Specs = {
	"type" : "Instance Type",
	"family " : "Instance Family",
	"cloud" : "Cloud",
	"virt" : "Virtualization Type",
	"ebs" : "EBS-optimized",
	"vcpu" : "vCPU",
	"memory" : "Memory (GiB)",
	"price" : "Price ($/Hr)",
	"storage" : "Instance Storage (GB)",
	"ecu" : "ECU",
	"network" : "Network Performance",
	"size" : "Instance Size"
};
var Tests = {
	"dhrystone" : "Dhrystone 2 using register variables",
	"double" : "Double-Precision Whetstone",
	"execl" : "Execl Throughput",
	"file1024" : "File Copy 1024 bufsize 2000 maxblocks",
	"file256" : "File Copy 256 bufsize 500 maxblocks",
	"file4096" : "File Copy 4096 bufsize 8000 maxblocks",
	"pipethru" : "Pipe Throughput",
	"pipecs" : "Pipe-based Context Switching",
	"process" : "Process Creation",
	"shell1" : "Shell Scripts (1 concurrent)",
	"shell8" : "Shell Scripts (8 concurrent)",
	"overhead" : "System Call Overhead",
	"index" : "System Benchmarks Index Score"
};
var TestUnits = {
	"dhrystone" : " lps",
	"double" : " MWIPS",
	"execl" : " lps",
	"file1024" : " KBps",
	"file256" : " KBps",
	"file4096" : " KBps",
	"pipethru" : " lps",
	"pipecs" : " lps",
	"process" : "l ps",
	"shell1" : " lpm",
	"shell8" : " lpm",
	"overhead" : " lps",
	"index" : ""
};

function drawGraph(el, title, subtitle, xaxis, rot, yaxis, tool, series) {
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
			categories : xaxis,
			labels : {
				rotation : rot
			}
		},
		yAxis : yaxis,
		tooltip : tool,
		legend : {
			align : "left",
			backgroundColor : '#FFF',
			floating : true,
			layout : "vertical",
			verticalAlign : "top",
			x : 200,
			y : 100
		},
		series : series
	});
}

function plotGroup(group, test, parallel) {
	/*
	 var el = document.createElement("div");
	 el.id = test;
	 el.style = "min-width: 600px; height: 800px; margin: 0 auto";
	 document.getElementById(group + "_" + parallel.toLowerCase()).appendChild(el);
	 */

	var names = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return i.name;
	});
	var means = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		ccolor = (i.cloud == 'EC2') ? colors[5] : colors[3];
		return {
			name : i.cloud + ' ' + i.name,
			color : ccolor,
			y : i.mean
		};
	});
	var ranges = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return i.range;
	});
	var nums = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return i.num;
	});
	var yaxis = [{
		title : {
			text : Tests[test] + ' (' + TestUnits[test] + ')'
		}
	}, {
		title : {
			gridLineWidth : 0,
			text : "Number of instances"
		},
		opposite : true
	}];
    var tool = {
        shared : true,
        valueSuffix : TestUnits[test]
    };
	var series = [{
		name : 'Min-Max range',
		type : 'arearange',
		yAxis : 0,
		data : ranges
	}, {
		color : colors[5],
		name : Tests[test],
		type : 'column',
		yAxis : 0,
		data : means
	}, {
		color : colors[1],
		name : 'Number of instances',
		type : 'line',
		yAxis : 1,
		data : nums
	}];
	//drawGraph(el, title, subtitle, xaxis, yaxis, yunit, series)
	drawGraph("#plot", Tests[test] + ' (' + parallel + ')', 'Grouped by ' + Specs[group], names, 0, yaxis, tool, series);
}

function massPlot(group, test) {
	$.getJSON("data/ub_" + group + "_" + test + ".json", function(d) {
		table = TAFFY();
		$.each(d, function(k, v) {
			table.insert({
				'test' : test,
				'parallel' : v['parallel'],
				'name' : k,
				'range' : [v['min'], v['max']],
				'mean' : v['mean'],
				'num' : v['num'],
				'cloud' : v['cloud'],
			});
		});
		plotGroup(group, test, 'multi');
	});
}

function plotInstances() {
	var virt = {
		'paravirtual' : 0,
		'hvm' : 0
	};
	for (v in virt ) {
		var names = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			return i.name.split("_")[0];
		});
		var vcpus = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			return i.vcpu;
		});
		var memories = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			return i.memory;
		});
		var prices = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			ccolor = (i.cloud == 'EC2') ? colors[5] : colors[3];
			return {
				color : ccolor,
				name : i.cloud + ': ' + i.name,
				y : i.price
			};
		});
		var yaxis = [{
			title : {
				text : Specs['price']
			},
			opposite : true
		}, {
			title : {
				text : Specs['vcpu']
			}
		}, {
			title : {
				text : Specs['memory']
			}
		}];
        var tool = {
            shared : true
        };
		var series = [{
			color : colors[5],
			name : Specs['price'],
			type : 'column',
			yAxis : 0,
			data : prices
		}, {
			name : Specs['vcpu'],
			type : 'line',
			yAxis : 1,
			data : vcpus
		}, {
			name : Specs['memory'],
			type : 'line',
			yAxis : 2,
			data : memories
		}];
		//drawGraph(el, title, subtitle, xaxis, yaxis, yunit, series)
		drawGraph("#" + v, "Instance Specifications (" + v + ")", 'EC2+Rackspace', names, 73, yaxis, tool, series);
	}
}

function allPlot(test) {
	var parallel = 'multi';
	var names = logs({
		'test' : test,
		'parallel' : parallel
	}).order('priceRatio').map(function(i) {
		return i.name;
	});
	var means = logs({
		'test' : test,
		'parallel' : parallel
	}).order('priceRatio').map(function(i) {
		ccolor = (i.cloud == 'EC2') ? colors[5] : colors[3];
		return {
			name : i.cloud + ' ' + i.name,
			color : ccolor,
			y : i.mean
		};
	});
	var sds = logs({
		'test' : test,
		'parallel' : parallel
	}).order('priceRatio').map(function(i) {
		var low = i.mean - i.sd;
		var high = i.mean - i.sd;
		return [low, high];
	});
    var priceRatios = logs({
		'test' : test,
		'parallel' : parallel
	}).order('priceRatio').map(function(i) {
		/*return i.mean/(i.price*100);*/
        return i.priceRatio;
	});
    var prices = logs({
		'test' : test,
		'parallel' : parallel
	}).order('priceRatio').map(function(i) {
		return i.price;
	});
	var yaxis = [{
		title : {
			text : Tests[test] + ' (' + TestUnits[test] + ')'
		}
	},{
		title : {
			text : Tests[test] + '/(100*' + Specs['price'] + ')'
		},
        opposite : true
	},{
		title : {
			text : Specs['price']
		},
        opposite : true
	}];
    var tool = {
        shared : true,
        valueSuffix : TestUnits[test]
    };
	var series = [{
		name : 'Standard Deviation',
		type : 'arearange',
		yAxis : 0,
		data : sds
	}, {
		color : colors[5],
		name : Tests[test],
		type : 'column',
		yAxis : 0,
		data : means
	},{
		color : colors[4],
		name : Tests[test] + '/(100*' + Specs['price'] + ')',
		type : 'line',
		yAxis : 1,
		data : priceRatios
	},{
		color : colors[7],
		name : Specs['price'],
		type : 'line',
		yAxis : 2,
		data : prices
	}];
	//drawGraph(el, title, subtitle, xaxis, yaxis, yunit, series)
	drawGraph("#allplot", Tests[test] + ' (' + parallel + ')', 'Sorted in efficiency per price', names, -73, yaxis, tool, series);
    $('#allplot').highcharts().setSize(1400,1000);
}

$(function() {
	$.getJSON("data/instances.json", function(d) {
		$.each(d, function(k, v) {
			//document.getElementById("debug").innerHTML += k + "<br>";
			instances.insert(v);
		});
		if (document.getElementById('paravirtual') != null)
			plotInstances();
	});
	$.getJSON("data/unixbench.json", function(d) {
		$.each(d, function(k, v) {
			logs.insert({
				test : v['test'],
				mean : v['mean'],
				name : v['name'],
				sd : v['sd'],
				parallel : v['parallel'],
                cloud : v['cloud'],
                price : v['price'],
                priceRatio : v['priceRatio']
			});
		});
		if (document.getElementById('allplot') != null)
			allPlot('index');
    });
});


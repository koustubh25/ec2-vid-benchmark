/*
 unixbench-visualizer.js v0.1 (2014-01-29)

 (c)2013-2014 Iori Mizutani(iomz@cisco.com)

 License: https://github.com/iomz/ec2-vid-benchmark/LICENSE

 Parse unixbench result json file to TAFFY DB and plot the figure with Highcharts.js
 */

var instances = TAFFY();
var logs = TAFFY();
var table = TAFFY();
var currentTab = 'home';
var colors = ['#4572A7', '#AA4643', '#89A54E', '#80699B', '#3D96AE', '#DB843D', '#92A8CD', '#A47D7C', '#B5CA92'];
var Parallels = ['single', 'multi'];
var Groups = ['size', 'type', 'family', 'price'];
var Sorters = {
	"priceRatio" : "Performance per Price",
	"mean" : "Performance",
	"price" : "Price"
};
var Specs = {
	"type" : "Instance Type",
	"family" : "Instance Family",
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
	"dhrystone" : "lps",
	"double" : "MWIPS",
	"execl" : "lps",
	"file1024" : "KBps",
	"file256" : "KBps",
	"file4096" : "KBps",
	"pipethru" : "lps",
	"pipecs" : "lps",
	"process" : "lps",
	"shell1" : "lpm",
	"shell8" : "lpm",
	"overhead" : "lps",
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
		plotOptions : {
			column : {
				stacking : 'normal'
			}
		},
		legend : {
			align : "left",
			backgroundColor : '#FFF',
			floating : true,
			layout : "vertical",
			verticalAlign : "top",
			x : 150,
			y : 50
		},
		series : series
	});
}

function plotGroup(group, test, parallel) {
	/*
	 var el = document.createElement("div");
	 el.id = test;
	 el.style = "min-width: 600px; height: 800px; margin: 0 auto";
	 document.getElementById(group + "_" + parallel).appendChild(el);
	 */
	if (test != 'index')
		var tname = Tests[test] + ' (' + TestUnits[test] + ')';
	else
		var tname = Tests[test];
	var names = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return i.name;
	});
	var ec2means = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		if (i.cloud == 'EC2') {
			return {
				name : i.cloud + ': ' + i.name,
				y : parseFloat(i.mean.toFixed(2))
			};
		} else {
			return {
				name : i.cloud + ': ' + i.name,
				y : 0
			};
		}
	});
	var rackmeans = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		if (i.cloud != 'EC2') {
			return {
				name : i.cloud + ': ' + i.name,
				y : parseFloat(i.mean.toFixed(2))
			};
		} else {
			return {
				name : i.cloud + ': ' + i.name,
				y : 0
			};
		}
	});
	var ranges = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return [parseFloat(i.range[0].toFixed(2)), parseFloat(i.range[1].toFixed(2))];
	});
	var nums = table({
		'test' : test,
		'parallel' : parallel
	}).order('mean').map(function(i) {
		return parseFloat(i.num.toFixed(2));
	});
	var yaxis = [{
		title : {
			text : tname
		}
	}, {
		title : {
			gridLineWidth : 0,
			text : "Number of instances"
		},
		opposite : true
	}];
	var tool = {
		shared : true
	};
	var series = [{
		name : 'Min-Max range',
		type : 'arearange',
		yAxis : 0,
		data : ranges
	}, {
		color : colors[5],
		name : 'EC2 ' + tname,
		type : 'column',
		yAxis : 0,
		data : ec2means
	}, {
		color : colors[3],
		name : 'Rackspace ' + tname,
		type : 'column',
		yAxis : 0,
		data : rackmeans
	}, {
		color : colors[1],
		name : 'Number of instances',
		type : 'line',
		yAxis : 1,
		data : nums
	}];
	//drawGraph(el, title, subtitle, xaxis, yaxis, yunit, series)
	drawGraph("#" + group, Tests[test] + ' (' + parallel + ')', 'Grouped by ' + Specs[group], names, 0, yaxis, tool, series);
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
		var ec2prices = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			if (i.cloud == 'EC2') {
				return {
					name : i.cloud + ': ' + i.name,
					y : i.price
				};
			} else {
				return {
					name : i.cloud + ': ' + i.name,
					y : 0
				};
			}
		});
		var rackprices = instances({
			virt : v,
			ebs : false
		}).order('price').map(function(i) {
			if (i.cloud != 'EC2') {
				return {
					name : i.cloud + ': ' + i.name,
					y : i.price
				};
			} else {
				return {
					name : i.cloud + ': ' + i.name,
					y : 0
				};
			}
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
			name : 'EC2 ' + Specs['price'],
			type : 'column',
			yAxis : 0,
			data : ec2prices
		}, {
			color : colors[3],
			name : 'Rackspace ' + Specs['price'],
			type : 'column',
			yAxis : 0,
			data : rackprices
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

function allPlot(parallel, test, sorter) {
	if (test != 'index')
		var tname = Tests[test] + ' (' + TestUnits[test] + ')';
	else
		var tname = Tests[test];
	if ( typeof (sorter) === 'undefined')
		sorter = 'priceRatio';
	var names = logs({
		'test' : test,
		'parallel' : parallel
	}).order(sorter).limit(20).map(function(i) {
		return i.name;
	});
	var means = logs({
		'test' : test,
		'parallel' : parallel
	}).order(sorter).limit(20).map(function(i) {
		ccolor = (i.cloud == 'EC2') ? colors[5] : colors[3];
		return {
			color : ccolor,
			name : i.cloud + ': ' + i.name,
			y : parseFloat(i.mean.toFixed(2))
		};
	});
	var sds = logs({
		'test' : test,
		'parallel' : parallel
	}).order(sorter).limit(20).map(function(i) {
		var low = (i.mean - i.sd).toFixed(2);
		var high = (i.mean + i.sd).toFixed(2);
		return {
			low : parseFloat(low),
			high : parseFloat(high),
			name : i.cloud + ': ' + i.name
		};
	});
	var priceRatios = logs({
		'test' : test,
		'parallel' : parallel
	}).order(sorter).limit(20).map(function(i) {
		/*return i.mean/(i.price*100);*/
		return {
			name : i.cloud + ': ' + i.name,
			y : parseFloat(i.priceRatio.toFixed(2))
		};
	});
	var prices = logs({
		'test' : test,
		'parallel' : parallel
	}).order(sorter).limit(20).map(function(i) {
		return {
			name : i.cloud + ': ' + i.name,
			y : i.price
		};
	});
	var yaxis = [{
		title : {
			text : tname
		}
	}, {
		title : {
			text : tname + '/(100*' + Specs['price'] + ')'
		},
		opposite : true
	}, {
		title : {
			text : Specs['price']
		},
		opposite : true
	}];
	var tool = {
		shared : true
	};
	var series = [{
		color : colors[2],
		name : 'Standard Deviation',
		type : 'arearange',
		yAxis : 0,
		data : sds
	}, {
		color : colors[5],
		name : tname,
		type : 'column',
		yAxis : 0,
		data : means
	}, {
		color : colors[4],
		name : tname + '/(100*' + Specs['price'] + ')',
		type : 'line',
		yAxis : 1,
		data : priceRatios
	}, {
		color : colors[7],
		name : Specs['price'],
		type : 'line',
		yAxis : 2,
		data : prices
	}];
	//drawGraph(el, title, subtitle, xaxis, yaxis, yunit, series)
	drawGraph("#" + parallel, Tests[test] + ' (' + parallel + ')', 'Sorted by ' + Sorters[sorter], names, -73, yaxis, tool, series);
	$('#' + parallel).highcharts().setSize(1200, 800);
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
		if (document.getElementById('singleallplot') != null)
			allPlot('single', 'index', 'priceRatio');
		if (document.getElementById('multiallplot') != null)
			allPlot('multi', 'index', 'priceRatio');
	});
});

$('a[data-toggle="tab"]').on('shown.bs.tab', function(e) {
	currentTab = e.target.href.match(/(\w+)$/g)[0];
	// activated tab
	if (-1 < Groups.indexOf(currentTab)) {
		massPlot(currentTab, 'index');
	} else if (-1 < Parallels.indexOf(currentTab)) {
		allPlot(currentTab, 'index', 'priceRatio');
	} else {
	}
	//e.relatedTarget; // previous tab
});

var logs = TAFFY();
var tsorter="elapsed";
var unix_hash = {};
var unix_cat = [];
var unix_paravirtual = [];
var unix_hvm = [];
var unix_paravirtual_single = [];
var unix_hvm_single = [];

function getType(name) {
    var arr = [];
    var desc = name.split('_');
    arr.push(desc[0]);
    arr.push(desc[1]);
    if (desc.length == 3){
        arr.push(true);
    } else {
        arr.push(false);
    }
    return arr;
}

function drawTime(series) {
    $("#time").highcharts({
        title: {
            text: "Encoding time / CPU time / Cost / ECU / Memory",
            x: -20 //center
        },
        subtitle: {
            text: "AWS EC2 38 instances on x264 benchmark",
            x: -20
        },
        xAxis: {
            categories: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return '[' + log.vType +']' + log.iType + (log.eType ? '(EbsOpt)' : '');}),
            labels: {
                rotation: 73 
            }
        },
        yAxis: [{
            gridLineWidth: 0,
            title: {
                text: "Cost (usd)"
            },
            opposite: true
        },{
            title: {
                text: "Time (seconds)"
            }
        },{
            title: {
                text: "Memory (GiB)"
            },
            opposite: true
        },{
            title: {
                text: "ECU"
            },
            opposite: true
        },{
            title: {
                text: "Real/CPU ratio"
            }
        }],
        tooltip: {
            shared: true
        },
        legend: {
            layout: "vertical",
            align: "left",
            x: 240,
            verticalAlign: "top",
            y: 80,
            floating: true,
            backgroundColor: '#FFFFFF'
        },
        series: series
    });
}

function changeSorter() {
    tsorter = $("input:checked").val();
    drawTime(
        [{
            name: 'Cost',
            type: 'column',
            tooltip: {
                valuePrefix: '$ '
            },
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.cost;})
        },{
            name: 'CPU time',
            tooltip: {
                valueSuffix: ' seconds'
            },
            yAxis: 1,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.user;}),
        },{
            name: 'Actual time elapsed',
            tooltip: {
                valueSuffix: ' seconds'
            },
            yAxis: 1,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.elapsed;}),
        },{
            name: 'Memory',
            tooltip: {
                valueSuffix: ' GiB'
            },
            yAxis: 2,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.memory;}),
        },{
            name: 'Number of ECUs',
            tooltip: {
                valueSuffix: ' ECU(s)'
            },
            yAxis: 3,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.ecu;}),
        },{
            name: 'Number of VCPUs',
            tooltip: {
                valueSuffix: ' VCPU(s)'
            },
            yAxis: 3,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.vcpu;}),
        },{
            name: 'Real/CPU ratio',
            tooltip: {
                valueSuffix: ' %'
            },
            yAxis: 4,
            data: logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.perf;}),
        }]
    );
}

function drawLineGraph(el, title, subtitle, categories, yaxis, tooltipVal, series) {
    $(el).highcharts({
        title: {
            text: title,
            x: -20 //center
        },
        subtitle: {
            text: subtitle,
            x: -20
        },
        xAxis: {
            categories: categories,
            labels: {
                rotation: 73 
            }
        },
        yAxis: {
            title: {
                text: yaxis
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: "#808080"
            }]
        },
        tooltip: {
            valueSuffix: tooltipVal
        },
        legend: {
            layout: "vertical",
            align: "right",
            verticalAlign: "middle",
            borderWidth: 0
        },
        series: series
    });
}

$(function () {
    $.getJSON( "data/logs.json", function( d ) {
        $.each( d, function( k, v ) {
            var types = getType(k);
            //var cost = parseFloat(v['price'])/60/60*parseInt(v['elapsed']).toFixed(2);
            var cost = Math.round(parseFloat(v['price'])/60/60*parseInt(v['elapsed'])*100)/100;
            var perf = Math.round(parseInt(v['user'])/parseFloat(v['elapsed'])/parseInt(v['vcpu'])*1000)/1000;
            logs.insert({vType:types[0],iType:types[1],eType:types[2],
                system:parseFloat(v['system']),user:parseFloat(v['user']),
                elapsed:parseInt(v['elapsed']),cpu:parseInt(v['cpu']),
                p1fps:parseFloat(v['p1fps']),p1kbs:parseFloat(v['p1kbs']),
                p2fps:parseFloat(v['p2fps']),p2kbs:parseFloat(v['p2kbs']),
                vcpu:parseInt(v['vcpu']),network:v['network'],
                ecu:parseFloat(v['ecu']),memory:parseFloat(v['memory']),
                price:parseFloat(v['price']),cost:cost,perf:perf,score:parseFloat(v['score']), scoreSingle:parseFloat(v['score_single'])
            });
        });
        
        changeSorter();

        var sorter="p1fps";
        drawLineGraph("#fps", "Average encoded FPS",
            "AWS EC2 38 instance on x264 benchmark",
            logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.iType + '_' + log.vType + '(EbsOptimized: ' + log.eType.toString() + ')';}),
            "Average FPS",
            " fps",
            [{
                name: 'Pass1',
                data: logs({iType:{"!is":"t1.micro"}}).order(sorter).map(function(log){return log.p1fps;}),
            },{
                name: 'Pass2',
                data: logs({iType:{"!is":"t1.micro"}}).order(sorter).map(function(log){return log.p2fps;}),
            }]
        );

        sorter="p1kbs";
        drawLineGraph("#kbs", "Average encoded rate",
            "AWS EC2 38 instance on x264 benchmark",
            logs({iType:{"!is":"t1.micro"}}).order(tsorter).map(function(log){return log.iType + '_' + log.vType + '(EbsOptimized: ' + log.eType.toString() + ')';}),
            "Average kbs",
            " kbs",
            [{
                name: 'Pass1',
                data: logs({iType:{"!is":"t1.micro"}}).order(sorter).map(function(log){return log.p1kbs;}),
            },{
                name: 'Pass2',
                data: logs({iType:{"!is":"t1.micro"}}).order(sorter).map(function(log){return log.p2kbs;}),
            }]
        );
            
        sorter='score';
        unix_list = logs().order(sorter).map(function(log){
                return [(log.iType + (log.eType ? '(EbsOpt)' : '')),
                        ((log.vType=='paravirtual') ? log.score : 0),
                        ((log.vType=='hvm') ? log.score : 0),
                         ((log.vType=='paravirtual') ? log.scoreSingle : 0),
                        ((log.vType=='hvm') ? log.scoreSingle : 0)];
           });
        for ( var i=0; i<unix_list.length; i++) {
            iType = unix_list[i][0];
            pVal = unix_list[i][1];
            hVal = unix_list[i][2];
            pValSingle = unix_list[i][3];
            hValSingle = unix_list[i][4];
            if (!(iType in unix_hash)) {
                unix_hash[iType] = {'pVal':0, 'hVal':0, 'pValSingle':0, 'hValSingle':0};
            }
            if (unix_hash[iType]['pVal'] == 0) {
                unix_hash[iType]['pVal'] = pVal;
            }
            if (unix_hash[iType]['hVal'] == 0) {
                unix_hash[iType]['hVal'] = hVal;
            }
            if (unix_hash[iType]['pValSingle'] == 0) {
                unix_hash[iType]['pValSingle'] = pValSingle;
            }
            if (unix_hash[iType]['hValSingle'] == 0) {
                unix_hash[iType]['hValSingle'] = hValSingle;
            }

        }
        unix_cat = Object.keys(unix_hash);
        unix_paravirtual = [];
        unix_hvm = [];
        unix_paravirtual_single = [];
        unix_hvm_single = [];

        for (var i=0; i<unix_cat.length; i++) {
            unix_paravirtual.push(unix_hash[unix_cat[i]]['pVal']);
            unix_hvm.push(unix_hash[unix_cat[i]]['hVal']);
            unix_paravirtual_single.push(unix_hash[unix_cat[i]]['pValSingle']);
            unix_hvm_single.push(unix_hash[unix_cat[i]]['hValSingle']);
        }

        $('#unix').highcharts({
            chart: {
                type: 'column',
                margin: [ 50, 50, 100, 80]
            },
            title: {
                text: "UnixBench scores"
            },
            xAxis: {
                categories: unix_cat,
                labels: {
                    rotation: 55
                }
            },
            yAxis: {
                title: {
                    text: "UnixBench score"
                },
                subtitle: {
                    text: 'Paravirtual / HVM'
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                footerFormat: '</table>',
                shared:true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                name: 'UnixBench score (Paravirtual)',
                data: unix_paravirtual
            },{
                name: 'UnixBench score (HVM)',
                data: unix_hvm
            }]
        });

        $('#unix_single').highcharts({
            chart: {
                type: 'column',
                margin: [ 50, 50, 100, 80]
            },
            title: {
                text: "UnixBench scores (per single core)"
            },
            xAxis: {
                categories: unix_cat,
                labels: {
                    rotation: 55
                }
            },
            yAxis: {
                title: {
                    text: "UnixBench score"
                },
                subtitle: {
                    text: 'Paravirtual / HVM'
                }
            },
            legend: {
                enabled: false
            },
            tooltip: {
                headerFormat: '<span style="font-size:10px">{point.key}</span><table>',
                pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td>' +
                    '<td style="padding:0"><b>{point.y:.1f}</b></td></tr>',
                footerFormat: '</table>',
                shared:true,
                useHTML: true
            },
            plotOptions: {
                column: {
                    pointPadding: 0.2,
                    borderWidth: 0
                }
            },
            series: [{
                name: 'UnixBench score (Paravirtual)',
                data: unix_paravirtual_single
            },{
                name: 'UnixBench score (HVM)',
                data: unix_hvm_single
            }]
        });
    });
});

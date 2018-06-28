// random stuff
var ctx = document.getElementById("graph");


var myChart = new Chart(ctx, {
    type: 'line',
    data: {
            labels: [],
            datasets: [{
                label: 'nums',
                showLine: true,
                data: [],
                backgroundColor: ['rgba(54, 162, 235, 0.2)'],
                borderColor: ['rgba(54, 162, 235, 1)'],
                borderWidth: 4
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'linear',
                    time: {
                        unit: 'second'
                    }
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });

function addDataPoint(chart, label, data){
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push({x: label, y: data});
    });
    // update chart
    chart.update();
};
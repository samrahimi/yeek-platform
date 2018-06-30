// random stuff

var ctx = document.getElementById("Graph").getContext("2d");

function produceGraph(titleName, ctx){
    var myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: titleName,
                lineTension: 0,
                showLine: true,
                data: [],
                backgroundColor: ['rgba(0, 128, 0, 0.6)'],
                borderColor: ['rgba(0, 128, 0, 1)'],
                borderWidth: 4
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    display: false,
                    type: 'time',
                    distribution: 'linear'
                }],
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
    return myChart;
}
function addDataPoint(chart, label, data){
    chart.data.labels.push(label);
    chart.data.datasets.forEach((dataset) => {
        dataset.data.push({x: label, y: data});
    });
    // update chart
    chart.update();
};

var myChart = produceGraph("Average Price Per Share", ctx);
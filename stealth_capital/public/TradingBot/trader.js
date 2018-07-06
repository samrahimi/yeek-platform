
// Sample random time between t1 and t2
// Choose between buy & sell event randomly
// Sample random eth value between eth1 and eth2
// Execute function
// still very rough, need to add more refined design
var EXECUTION_TIME = null;
var EVENT_TO_EXECUTE = null;
var RAND_ETH_VAL = null;

function sampleRandom(min, max){

    return Math.random() * (max - min) + min;

}

// samples event BUY or SELL by flipping a coin
function sampleEvent(){

    if (Math.random() >= 0.5){

        return "BUY";

    }

    return "SELL";
}

function main(){

    var time1 = 0.0;
    var time2 = 15.0 * 1000.0;
    EXECUTION_TIME = sampleRandom(time1, time2);

}

main();
setInterval(async() => {

    var eth1 = 0.05;
    var eth2 = 0.5;
    EVENT_TO_EXECUTE = sampleEvent();
    RAND_ETH_VAL = sampleRandom(eth1, eth2);

}, EXECUTION_TIME);

// Sample random time between t1 and t2
// Choose between buy & sell event randomly
// Sample random eth value between eth1 and eth2
// Execute function
const testAddress = "0x335c949c06fa1ba8744d98e3aa2c2a2deaa9255c"
var execution_time = null;
var rand_event= null;
var rand_eth = null;
// min and max eth ranges
const MIN_ETH = 0.05;
const MAX_ETH = 0.5;
// min and max time ranges in milliseconds
const T1 = 0.0;
const T2 = 15.0 * 1000 * 60; // 15 minutes in milliseconds
// min and max token values
const MIN_TOKENS = 0.0;
var MAX_TOKENS;

// define contract up top
var contract = new web3.eth.Contract(exchangerABI, testAddress);
// samples random between min and max values
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

// execute event through contract instance
async function executeEvent(){
    
    if (rand_event == "BUY"){
        var eth2tokens = await contract.methods.getPurchasePrice(rand_eth * Math.pow(10.0, 18)).call();
        await contract.methods.buy(eth2tokens).send({from: testAddress});
        return ;

    }else{
        // eth returned in wei
        var tokens2eth = await contract.methods.getSalePrice(rand_tokens);
        //console.log(tokens2eth["arguments"][0]);
        await contract.methods.receiveApproval(testAddress, tokens2eth["arguments"][0], testAddress, "0x00").send({from: testAddress});
        return ;
    }
}

// run bot in execution time intervals
execution_time = sampleRandom(T1, T2);
//console.log(execution_time);
var token_promise = contract.methods.getPurchasePrice(MAX_ETH * Math.pow(10.0, 18)).call();
token_promise.then(function(result) {
    MAX_TOKENS = result;
});

setInterval(async() => {

    rand_event = sampleEvent();
    rand_eth = sampleRandom(MIN_ETH, MAX_ETH);
    rand_tokens = sampleRandom(MIN_TOKENS, MAX_TOKENS);
    await executeEvent();

}, execution_time); 
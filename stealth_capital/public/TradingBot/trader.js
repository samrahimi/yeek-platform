
// Sample random time between t1 and t2
// Choose between buy & sell event randomly
// Sample random eth value between eth1 and eth2
// Execute function

const testAddress = "0x335c949c06fa1ba8744d98e3aa2c2a2deaa9255c"
const tokenAddress = "0x96387e69FAc1d3b63e31a3a70eE3a06761887759"
var execution_time = null;
var rand_event= null;
var rand_eth = null;
// min and max eth ranges
const MIN_ETH = 0.0001;
const MAX_ETH = 0.0002;
// min and max time ranges in milliseconds
const T1 = 5.0 * 1000 * 60; // 5 minutes in milliseconds
const T2 = 15.0 * 1000 * 60; // 15 minutes in milliseconds
// min and max token values
const MIN_TOKENS = 0.0;
var MAX_TOKENS;

// INFO FOR TRADER BOT ACCOUNT:
const accAddr = '0x2f9874d6bcf0a73f0b4dc6204e30b092123a7e2d';
const accPrivKey = '2C607306B087AB8D813ADCCB030C321874FF260BD749E2F156391A48C5108BB0'
// define contract up top
var contract = new web3.eth.Contract(exchangerABI, testAddress);
const acc = web3.eth.accounts.privateKeyToAccount(accPrivKey.indexOf('0x') === 0 ? accPrivKey : '0x' + accPrivKey);
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
// gets the updated nonce based on unmined blocks to queue them
function getUpdatedNonce(){

    var noncePromise = web3.eth.getTransactionCount(acc.address, 'pending');
    noncePromise.then(function(result) {
        return result;
    })
}
// this function executes events uses infura to sign off on the transactions
// create new account and store for further use
// 
async function executeEventsInfura(){
    var encodedData;
    updateGasPrice();

    if (rand_event == "BUY"){
        // buying an ERC20 token using eth
        var eth2tokens = await contract.methods.getPurchasePrice(rand_eth * Math.pow(10.0, 18)).call();
        encodedData =  contract.methods.buy(eth2tokens).encodeABI();
        //console.log("Eth: " + rand_eth);
        //console.log("Address: " + acc.address);
        
    }else{
        // selling ERC20 token for eth
        var tokens2eth = await contract.methods.getSalePrice(rand_tokens);
        encodedData = await contract.methods.receiveApproval(acc.address, tokens2eth["arguments"][0], tokenAddress, "0x00").encodeABI();

    }
    
    var tx = {
        from : acc.address,
        to : testAddress,
        data : encodedData,
        gasPrice: gasPrice,
        gas: 2000000
    }

    //console.log(web3.eth.getBalance(acc.address));
    web3.eth.accounts.signTransaction(tx, acc.privateKey).then(signed => {
        var transaction = web3.eth.sendSignedTransaction(signed.rawTransaction);

        transaction.on('confirmation', (confirmationNumber, receipt) => {
            console.log("Confirmation Number: "  + confirmationNumber, receipt);
        });

        transaction.on('transactionHash', hash => {
            console.log("Hash: " + hash);
        });
        
        transaction.on('receipt', receipt => {
            console.log("Receipt: " + receipt);
        });

        transaction.on('error', error => {
            console.log (error);
        });

    });
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
var token_promise = contract.methods.getPurchasePrice(MAX_ETH * Math.pow(10.0, 18)).call();
token_promise.then(function(result) {
    MAX_TOKENS = result;
});
console.log(execution_time)

setInterval(async() => {

    rand_event = sampleEvent();
    //rand_event = "BUY";
    rand_eth = sampleRandom(MIN_ETH, MAX_ETH);
    rand_tokens = sampleRandom(MIN_TOKENS, MAX_TOKENS);
    await executeEventsInfura();

}, execution_time); 
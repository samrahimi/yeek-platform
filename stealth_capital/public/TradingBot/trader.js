
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
const MIN_ETH = 0.01;
const MAX_ETH = 0.05;
// min and max time ranges in milliseconds
const T1 = 3.0 * 1000 * 60; // 3 minutes in milliseconds
const T2 = 6.0 * 1000 * 60; // 6 minutes in milliseconds
// min and max token values

// INFO FOR TRADER BOT ACCOUNT:
const accAddr = '0xF8008F03A0E6fE0cC316c9888d68D65587337013';
const accPrivKey = 'ed227e33021e231d9d198673e33facd0f87a90b3baa0256f36e3c6eb4d972da2';
//const accPrivKey = 'ed227e33021e231d9d198673e33facd0f87a90b3baa0256f36e3c6eb4d972da2';
// define contract up top
var contract = new web3.eth.Contract(exchangerABI, testAddress);
var tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
const acc = web3.eth.accounts.privateKeyToAccount(accPrivKey.indexOf('0x') === 0 ? accPrivKey : '0x' + accPrivKey);
// samples random between min and max values

// prints balance of account
web3.eth.getBalance(accAddr).then(function(res) {
    console.log("Balance in Eth: " + web3.utils.fromWei(res + '', 'ether'));
});
function sampleRandom(min, max){

    return (Math.random() * (max - min) + min);

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
    var tx;
    if (rand_event == "BUY"){
        // buying an ERC20 token using eth
        var val = web3.utils.toWei(rand_eth.toFixed(10), 'ether')
        encodedData =  contract.methods.buy(0).encodeABI();
        //console.log("Eth: " + rand_eth);
        //console.log("Address: " + acc.address);
        tx = {
            from : accAddr,
            to : testAddress,
            value: val,
            data : encodedData,
            gasPrice: web3.utils.toWei(gasPrice.toFixed(1), 'gwei'),
            gas: 200000 // random large value to set
        }
    }else if (rand_event == "SELL"){
        // selling ERC20 token for eth
        console.log("Random tokens to trade: " + rand_tokens);
        encodedData = tokenContract.methods.approveAndCall(testAddress, rand_tokens, "0x00").encodeABI();
        tx = {
            from : accAddr,
            to : tokenAddress,
            data : encodedData,
            gasPrice: web3.utils.toWei(gasPrice.toFixed(1), 'gwei'),
            gas: 500000 // random large value to set
        }
    }
    console.log(JSON.stringify(tx, null, 2));
    //console.log(web3.eth.getBalance(acc.address));
    web3.eth.accounts.signTransaction(tx, acc.privateKey).then(signed => {
        var transaction = web3.eth.sendSignedTransaction(signed.rawTransaction);

        transaction.on('transactionHash', hash => {
            console.log("Hash: " + hash);
        });
        
        transaction.on('receipt', receipt => {
            console.log("Receipt: " + receipt);
        });

        transaction.on('error', error => {
            console.log (error);
        });

    }).catch((ex) => {console.log(ex.toString())});
}

// run bot in execution time intervals
execution_time = sampleRandom(T1, T2);
console.log("Execution time: " + execution_time)
updateGasPrice();

setTimeout(() => {
    setInterval(() => {

        rand_event = sampleEvent();
        rand_eth = sampleRandom(MIN_ETH, MAX_ETH);
        if (rand_event == "SELL")
        {
            var token_promise = contract.methods.getPurchasePrice(decimalToRaw(rand_eth, 18)).call();
            token_promise.then(function(result) {
                rand_tokens = result;
                executeEventsInfura()
            });
        } else {
            executeEventsInfura()
        }


    }, execution_time); 
}, 5000) 

function tester()
{
    rand_event = "SELL"
    rand_eth = sampleRandom(MIN_ETH, MAX_ETH);
    var token_promise = contract.methods.getPurchasePrice(decimalToRaw(rand_eth, 18)).call();
    token_promise.then(function(result) {
        rand_tokens = result;
        executeEventsInfura()
    });
}

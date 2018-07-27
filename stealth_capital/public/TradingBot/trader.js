// Read a page's GET URL variables and return them as an associative array.
let queryString = function (key)
{
    var vars = [], hash;
    var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
    for(var i = 0; i < hashes.length; i++)
    {
        hash = hashes[i].split('=');
        vars.push(hash[0]);
        vars[hash[0]] = hash[1];
    }
    return vars[key];
}


//Global Range Params
var execution_time = null;
var rand_event= null;
var rand_eth = null;
// min and max eth ranges (defaults: override these with setOptions)
let MIN_ETH = 0.005;
let MAX_ETH = 0.03;
// min and max time ranges in milliseconds
let T1 = 1 * 1000 * 60; // 50 mins
let T2 = 30 * 1000 * 60; // 70 mins
// min and max token values


//Sets the min / max trade sizes and intervals btwn trades made by the bot
//Trade sizes should be specified in ether, time in milliseconds
function setOptions(minTradeSize, maxTradeSize, minTimeInterval, maxTimeInterval) {
    MIN_ETH = minTradeSize
    MAX_ETH = maxTradeSize
    T1 = minTimeInterval
    T2 = maxTimeInterval
}

//start the trading bot with  provided contract addys and account credentials
function run(testAddress, tokenAddress, accAddr, accPrivKey) {
    var contract = new web3.eth.Contract(exchangerABI, testAddress);
    var tokenContract = new web3.eth.Contract(tokenABI, tokenAddress);
    const acc = web3.eth.accounts.privateKeyToAccount(accPrivKey.indexOf('0x') === 0 ? accPrivKey : '0x' + accPrivKey);

        // prints balance of account
    web3.eth.getBalance(accAddr).then(function(res) {
        console.log("Starting balance in Eth: " + web3.utils.fromWei(res + '', 'ether'));
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

    // executes a buy or sell trade using the account, token, and exchanger addresses specified on startup 
    // direction should be "BUY" or "SELL"
    // for buys, amountInEth must be specified - for sell, amountInTokens must be specified
    // note that amountInTokens is raw (no decimal)
    async function createAndSendSignedTx(direction, amountInEth, amountInTokens){
        var encodedData;
        var tx;
        if (direction == "BUY"){
            // buying an ERC20 token using eth
            var val = web3.utils.toWei(amountInEth.toFixed(10), 'ether')
            console.log("Order to buy. Size in Ether: "+amountInEth)
            document.write("Order to buy. Size in Ether: "+amountInEth+"<br />")


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
        }else if (direction == "SELL"){
            // selling ERC20 token for eth
            console.log("Order to sell  "+rawToDecimal(amountInTokens, 18)+" tokens...");
            document.write("Order to sell  "+rawToDecimal(amountInTokens, 18)+" tokens... <br />");

            encodedData = tokenContract.methods.approveAndCall(testAddress, amountInTokens, "0x00").encodeABI();
            tx = {
                from : accAddr,
                to : tokenAddress,
                data : encodedData,
                gasPrice: web3.utils.toWei(gasPrice.toFixed(1), 'gwei'),
                gas: 500000 // random large value to set
            }
        }
        console.log(JSON.stringify(tx, null, 2));
        document.write(JSON.stringify(tx, null, 2)+ "<br />");


        //console.log(web3.eth.getBalance(acc.address));
        web3.eth.accounts.signTransaction(tx, acc.privateKey).then(signed => {
            var transaction = web3.eth.sendSignedTransaction(signed.rawTransaction);

            transaction.on('transactionHash', hash => {
                console.log("Transaction sent to the blockchain. Hash: " + hash);
                document.write("Transaction sent to the blockchain. Hash: "+hash+"<br />");

                //this is the end of the workflow that is triggered by executeRandomTrade()
                //so we can safely schedule the next iteration 
                scheduleNextTrade()
            });
            
            transaction.on('receipt', receipt => {
                console.log("Receipt: " + receipt);
            });

            transaction.on('error', error => {
                console.log (error);

                //errors occur due to 
                //(a) insufficient funds or tokens in the trader's account
                //(b) trade size is too large to be processed by the selected exchanger
                //
                //these will happen frequently, so we log them and move on to the next trade
                scheduleNextTrade() 
            });

        }).catch((ex) => {
            console.log(ex.toString())
            scheduleNextTrade() 
        });
    }

    // schedules the next trade at a random time in the future 
    // use setOptions to specify min and max time interval between trades
    function scheduleNextTrade() {
        let timeTillNextTrade = sampleRandom(T1, T2);
        setTimeout(executeRandomTrade, timeTillNextTrade)
        console.log("Next trade will be in "+timeTillNextTrade+" MS!")
        document.write("Next trade will be in "+timeTillNextTrade+" MS!<br /><br />")

    }

    function executeRandomTrade() {
        updateGasPrice(); //for next time

        let orderType = sampleEvent();
        let orderSizeEth = sampleRandom(MIN_ETH, MAX_ETH);
        if (orderType == "SELL")
        {
            var token_promise = contract.methods.getPurchasePrice(decimalToRaw(orderSizeEth, 18)).call();
            token_promise.then(function(result) {
                let orderSizeRawTokens = result;
                createAndSendSignedTx(orderType, orderSizeEth, orderSizeRawTokens)
            });
        } else {
            createAndSendSignedTx(orderType, orderSizeEth, 0)
        }
    }

    //On startup, allow 5000ms to obtain the gas price, then schedule the first trade
    updateGasPrice();
    setTimeout(scheduleNextTrade, 5000)
}
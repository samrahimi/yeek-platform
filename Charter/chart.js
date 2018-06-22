Web3 = require('web3')
// this function will listen to Buy event in exchanger.sol contract and record its arguments
// intent is to return arguments, append to array along with time stamp, and plot
// truffle version will be added in the next couple days to test function and other such
// event listeners.
function filterBuyEvent(contractABI, contractAddress) {
    // using contract ABI and address, function will listen to Buy event and
    // extract latest block info
    if (typeof web3 !== 'undefined'){
        web3 = new Web3(web3.currentProvider);
    }else{
        web3 = new Web3(new Web3.providers.HttpProvider("some local host"));
    }

    var yeekContract = web3.eth.contract(contractABI).at(contractAddress);
    // will get all event data from 0th block to latest block (can be adjusted)
    var eventBuy = yeekContract.Buy({fromBlock: 0, toBlock: 'latest'});
    eventBuy.watch(function(err, res){
        if (err){
            console.log("Error in Buy event");
            return;
        }
        // send to console just to log somewhere for now
        // Arguments should be returned along with time as an index
        // to plot for users.
        console.log("Buy event succeeded!");
        console.log("Purchaser:" + res.args.purchaser);
        console.log("Amt Wei:" + res.args.amountInWei);
        console.log("Amt Token:" + res.args.amountInToken);
    });
}
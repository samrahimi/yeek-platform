// same logic and pattern as buy listener
var yeekContract = web3.eth.contract(exchangerABI).at(addr);

var sell = yeekContract.Sell({}, {fromBlock: 'latest'}); // latest block buy data

buy.watch(function(error, result){
    if (!error){
        window.alert("Sell event successfully watched!");
        // package and send data to frontend
    }else{
        window.alert("Sell event subscription caused error!");
        console.log(error);
    }
});
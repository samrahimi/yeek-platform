const testAddress = "0x335c949c06fa1ba8744d98e3aa2c2a2deaa9255c"
function initWeb3() {
        //If web3 doesn't exist, it means the user is missing a necessary browser-plugin wallet
        //or is using a mobile browser without web3 support. We explain it to them, put the 
        //app in read only mode, and continue.
        if (typeof web3 == 'undefined') {
            //Workaround for using web3 1.0 with HTTP provider
            Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/yQKGJVARKy6KfaHEJmy8"))
            
            console.log("Using web3 1.0 with Infura node. Metamask etc not found")
        }
        else {
            let myAddress = window.web3.eth.defaultAccount;

            //Even if web3 is defined, the user may not be logged in
            //In either case, we go into read only mode, and connect to our fallback Ethereum node
            //which will do everything except sending tokens and executing trades
            if (typeof myAddress == 'undefined' || myAddress == null) {
                //Workaround for using web3 1.0 with HTTP provider
                Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
                window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/yQKGJVARKy6KfaHEJmy8"))
                
                console.log("Using web3 1.0 with Infura node. Metamask etc not logged in")
            } else {
                window.web3 = new Web3(window.web3.currentProvider);
                console.log("Found Metamask or compatible wallet. Setting as provider and upgrading web3 to v1.0")
            }
        }
    }
async function watchBuyEv(contractAddress, contractABI){
    
    var contract = web3.eth.contract(contractABI, contractAddress);
    var buySubscribe = contract.Buy({}, {fromBlock: 'latest'});
    try{
        var result = await buySubscribe.watch()
        window.alert("Buy event successfully watched!");
        console.log(result);
    }catch(err){
        window.alert("Buy event subscription caused error!");
        console.log(err);
    }

}

async function getPastEv(contractAddress, contractABI){

    var contract = new web3.eth.Contract(contractABI, contractAddress);
    contract.getPastEvents("allEvents", {
            filter: {},
            fromBlock: 0, 
            toBlock: 'latest'
        }
    ).then((events) => {
        console.log(JSON.stringify(events, null, 2));
    });
}

setTimeout(() => {
    initWeb3();
    getPastEv(testAddress, exchangerABI);
    window.alert("DONE!");
}, 1000);




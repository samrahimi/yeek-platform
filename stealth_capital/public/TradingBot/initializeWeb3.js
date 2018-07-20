let API_KEY = 'gdfRd6Ffu1Y9irW70Ljz'
function initWeb3() {
    //If web3 doesn't exist, it means the user is missing a necessary browser-plugin wallet
    //or is using a mobile browser without web3 support. We explain it to them, put the 
    //app in read only mode, and continue.
    if (typeof web3 == 'undefined') {
        //Workaround for using web3 1.0 with HTTP provider
        Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send;
        window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + API_KEY))
        
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
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + API_KEY))
            
            console.log("Using web3 1.0 with Infura node. Metamask etc not logged in")
        } else {
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/" + API_KEY));
            console.log("Found Metamask or compatible wallet, but using web3 1.0 with Infura node for trader bot!");
        }
    }
}

initWeb3();
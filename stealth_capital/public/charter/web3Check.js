// checks for web3 instance
if(typeof web3 !== 'undefined'){

    web3 = new Web3(web3.currentProvider);

}else{

    web3 = new Web3(new Web3.providers.HttpProvider('...'));

}

web3.eth.defaultAccount = web3.eth.accounts[0];

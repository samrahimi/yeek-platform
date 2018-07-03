//3rd party API integrations: rates, partner exchanges, etc
window.ETHUSD=0;
//Nominal order size used for calculating the quote price
window.baseOrderSizeInEth = 0.001
window.gasPrice = 0

function updateETHUSD() {
    $.getJSON("https://api.coinmarketcap.com/v2/ticker/1027/", (result) => {
        window.ETHUSD = result.data.quotes["USD"].price
        console.log("got updated ETHUSD price: "+ window.ETHUSD)
    })
}

function convertToUSD(amountInEth) {
    return amountInEth * window.ETHUSD;
}

// Gets the latest quote price (in Ether) for any token
// by requesting it from the associated exchanger.
// Accepts: the address of the exchanger linked with the desired token
async function getPriceQuote(exchangerAddress) {
    let exchangerContract = null
    if (!exchangeUI.readonly)
        exchangerContract = eth.contract(exchangerABI, "", { "from": myAddress }).at(exchangerAddress)
    else
        exchangerContract = eth.contract(exchangerABI).at(exchangerAddress)

    let totalTokens = await exchangerContract.getPurchasePrice(decimalToRaw(window.baseOrderSizeInEth, 18))
    let actualTokens = rawToDecimal(totalTokens[0].toString(10), 18);
    return window.baseOrderSizeInEth / actualTokens; //If 1 eth gets you n tokens, each token is worth 1/n eth. 
}

async function updateGasPrice() {
    web3.eth.getGasPrice((e,r) =>{
        console.log("Default gas price: "+r.toString(10));
        let g= r / 1000000000
        if (g <= 10) 
            window.gasPrice = g * 3
        else 
            window.gasPrice = g
    })
}

$(document).ready(() => {
    updateETHUSD();
})

//3rd party API integrations: rates, partner exchanges, etc
window.ETHUSD=0;
//Nominal order size used for calculating the quote price
window.baseOrderSizeInEth = 0.001

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
    let exchangerContract = eth.contract(exchangerABI, "", { "from": myAddress }).at(exchangerAddress)

    let totalTokens = await exchangerContract.getPurchasePrice(decimalToRaw(window.baseOrderSizeInEth, 18))
    let actualTokens = rawToDecimal(totalTokens[0].toString(10), 18);
    return window.baseOrderSizeInEth / actualTokens; //If 1 eth gets you n tokens, each token is worth 1/n eth. 
}

$(document).ready(() => {
    updateETHUSD();
})

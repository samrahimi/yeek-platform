const testAddress = "0x335c949c06fa1ba8744d98e3aa2c2a2deaa9255c"
let AVG_BLOCK_TIME = 15
let SECONDS_PER_DAY = 86400
let DATASET = null
let ASSET_NAME = null
let numDays = 30
let LATEST_BLOCK_NUM = null
let DATA = []; // global data array

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


const exchangerAddress = queryString("address")
const assetName = queryString("name")
const timeSpan = queryString("days")

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

//Gets the current price per share, based on a 0.001 (tiny) order
async function getCurrentPrice(contractAddress, contractABI) {
    var exchangerContract = new web3.eth.Contract(contractABI, contractAddress)
    let totalTokens = await exchangerContract.methods.getPurchasePrice(decimalToRaw(0.001, 18)).call()
    let actualTokens = rawToDecimal(totalTokens, 18);
    return 0.001 / actualTokens; //If 1 eth gets you n tokens, each token is worth 1/n eth. 

}

async function setLatestBlockNumber(){

    LATEST_BLOCK_NUM = await web3.eth.getBlockNumber();

}


//A block is about 15 seconds
//To convert a block number to a time, we figure out how many seconds ago it was created
//(latestBlockNumber - blockNumber) * 15 and then subtract that from the current date
function calculateTimeStamp(blockNumber){
    //How many seconds ago did it happen
    let secs = (LATEST_BLOCK_NUM - blockNumber) * AVG_BLOCK_TIME
    let now = Date.now()               //Gets current date as milliseconds since 1970
    let previous = now - (secs * 1000) //We figure out the previous date by calculating the block age in seconds, multiply by 1000, subtract from now

    //Return as a standard timestamp, caller can convert to Date if they wish
    return previous
}


// gets all past events (Buy and Sell) from a given exchanger contract
// going back a specific number of days
async function getPastEv(contractAddress, contractABI){
    var contract = new web3.eth.Contract(contractABI, contractAddress);
    LATEST_BLOCK_NUM = await web3.eth.getBlockNumber();

    /*
    if (blockNumber !== -1){
        differ = blockNumber;
    }else{
        differ = (30 * SECONDS_PER_DAY) / AVG_BLOCK_TIME // last 30 days
    } */

    // 30 days = 2592000 seconds and avg block time is 15 seconds
    // avg num blocks in last 30 days = 2592000 / 15
    // and we subtract that from the current latest block number
    var events = await contract.getPastEvents("allEvents", {
            filter: {},
            fromBlock: LATEST_BLOCK_NUM - ((numDays * SECONDS_PER_DAY) / AVG_BLOCK_TIME), 
            toBlock: 'latest'
        }
    )

    DATA = events.map((x) =>  
        {
            return {
                blockNum:x.blockNumber,
                timeStamp: calculateTimeStamp(x.blockNumber), 
                direction: x.event, 
                amountInWei: x.returnValues.amountInWei, 
                amountInTokens:x.returnValues.amountInToken,
                avgPricePerShare: x.returnValues.amountInWei / x.returnValues.amountInToken
            }
        })
};

// sorts data into hash map defined by bucket duration parameter
async function bucketData(data, bucket_duration){
    var table = {}
    for (var i = 0; i < data.length; i++){
        var key = (Math.floor(data[i].timeStamp / bucket_duration) * bucket_duration).toString()
        if (table[key] == null || typeof table[key] == "undefined")
            table[key]=[]

        table[key].push(data[i])
    }
    return table
}

//calculaes decimal change in price, not percentage
function changeInPrice(p1, p2){

    return (p2 - p1)/p1;

}
// this function grabs opening price, closing price, highest and lowest avg price/share,
// tx volume in eth, and the change in price for each bucket in table passed
// tx volume is calculated for last 24 hours.
async function grabGraphingData(table){

    var gData = []

    // loop through each bucket
    for (var key in table){ 
        var events = table[key]
        var openingPrice = events[0].avgPricePerShare;
        var closingPrice = events[events.length - 1].avgPricePerShare;
        var deltaPrice = changeInPrice(openingPrice, closingPrice); // decimal change in price
        var high = closingPrice;
        var low = openingPrice;
        var vol = 0.0;
        // loop through each event
        for (var i = 0; i < events.length; i++){
            if (high < events[i].avgPricePerShare){
                high = events[i].avgPricePerShare;
            }
            if (low > events[i].avgPricePerShare){
                low = events[i].avgPricePerShare;
            }
            // get volume in last 24 hours 
            if (SECONDS_PER_DAY >= calculateTimeStamp(LATEST_BLOCK_NUM) - Number(key)){
                vol = vol + events[i].amountInWei;
            }
            
        }
        let rounded_date = new Date(parseInt(key))
        var ethVol = vol / Math.pow(10.0, 18);
        gData.push({
            "x": key,
            "open": openingPrice,
            "close": closingPrice,
            "high": high,
            "low": low,
            "vol": ethVol,
            'change': deltaPrice
        });
    }
    return gData


}

async function main(testAddress, exchangerABI){

    await getPastEv(testAddress, exchangerABI);
    var table = await bucketData(DATA, SECONDS_PER_DAY*1000);
    var graphable = await grabGraphingData(table)
    return graphable
}

setTimeout(async() => {
    initWeb3();
    var graphable = await main(testAddress, exchangerABI);
    drawChart(graphable); //Renders the chart by calling drawChart (in candlestick.html)
    console.log(JSON.stringify(graphable, null, 2));
}, 1000);





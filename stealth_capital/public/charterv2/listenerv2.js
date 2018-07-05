const testAddress = "0x335c949c06fa1ba8744d98e3aa2c2a2deaa9255c"
let AVG_BLOCK_TIME = 15
let SECONDS_PER_DAY = 86400
let DATASET = null
let ASSET_NAME = null
let DAYS = 0
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
// gets all past events (Buy and Sell) from a given exchanger contract
// going back a specific number of days
async function getPastEv(contractAddress, contractABI, blockNumber=-1){
    var contract = new web3.eth.Contract(contractABI, contractAddress);
    var differ = 0;
    LATEST_BLOCK_NUM = await web3.eth.getBlockNumber();
    if (blockNumber !== -1){
        differ = blockNumber;
    }else{
        differ = (30 * SECONDS_PER_DAY) / AVG_BLOCK_TIME // last 30 days
    }

    // 30 days = 2592000 seconds and avg block time is 15 seconds
    // avg num blocks in last 30 days = 2592000 / 15
    // and we subtract that from the current latest block number
    var events = await contract.getPastEvents("allEvents", {
            filter: {},
            fromBlock: LATEST_BLOCK_NUM - differ, 
            toBlock: 'latest'
        }
    )

    DATA.push(events.map((x) =>  
        {
            return {
                blockNum:x.blockNumber,
                timeStamp: calculateTimeStamp(x.blockNumber), 
                direction: x.event, 
                amountInWei: x.returnValues.amountInWei, 
                amountInTokens:x.returnValues.amountInToken,
                avgPricePerShare: x.returnValues.amountInWei / x.returnValues.amountInToken
            }
        }));
};

// sorts data into hash map defined by bucket duration parameter
async function bucketData(data, bucket_duration){
    var table = {}
    for (var i = 0; i < DATA.length; i++){
        for (var j = 0; j < DATA[i].length; j++){
            var ev = DATA[i][j];
            var temp = ev.timeStamp;
            var k = 0;
            while (temp > 0){
                temp = temp - bucket_duration;
                k = k + 1;
            }
            var key = bucket_duration * k;
            if (!(String(key) in table)){
                table[String(key)] = [ev];
            }else{
                console.log("shabba");
                table[String(key)].push(ev);
            }
        }
    }
    return table;

}

// this function grabs opening price, closing price, highest and lowest avg price/share,
// transaction volume in eth, and the change in price for each bucket in table passed
async function grabGraphingData(table){

    var gData = {};

    for (var key in table){
        var events = table[key]
        var openingPrice = events[0].avgPricePerShare;
        var closingPrice = events[events.length - 1].avgPricePerShare;
        var deltaPrice = 1.0 / (closingPrice - openingPrice);
        var high = closingPrice;
        var low = openingPrice;
        for (var i = 0; i < events.length; i++){
            if (high < events[i].avgPricePerShare){
                high = events[i].avgPricePerShare;
            }
            if (low > events[i].avgPricePerShare){
                low = events[i].avgPricePerShare;
            }
        }

        gData[key] = [{
            "open": openingPrice,
            "close": closingPrice,
            "high": high,
            "low": low,
            "volume": null,
            "priceChange": deltaPrice
        }];
    }


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

async function main(testAddress, exchangerABI){

    await getPastEv(testAddress, exchangerABI);
    var table = await bucketData(DATA, SECONDS_PER_DAY);
    return table;
}

setTimeout(async() => {
    initWeb3();
    var table = await main(testAddress, exchangerABI);
    console.log(JSON.stringify(table, null, 2));
}, 1000);





let AVG_BLOCK_TIME = 15
let SECONDS_PER_DAY = 86400
let DATASET = null
let ASSET_NAME = null
let DAYS = 0

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
// gets all past events (Buy and Sell) from a given exchanger contract
// going back a specific number of days
async function getPastEv(contractAddress, contractABI, numDays){
    var amtWeiSell = [];
    var amtWeiBuy = [];
    var contract = new web3.eth.Contract(contractABI, contractAddress);
    var latestBlockNum = await web3.eth.getBlockNumber();
    // 30 days = 2592000 seconds and avg block time is 15 seconds
    // avg num blocks in last 30 days = 2592000 / 15
    // and we subtract that from the current latest block number
    var events = await contract.getPastEvents("allEvents", {
            filter: {},
            fromBlock: latestBlockNum - ((numDays * SECONDS_PER_DAY) / AVG_BLOCK_TIME), 
            toBlock: 'latest'
        }
    )

    let eventsFormatted = events.map((x) =>  
        {
            return {
                blockNum:x.blockNumber,
                timeStamp: calculateTimeStamp(x.blockNumber, latestBlockNum), 
                direction: x.event, 
                amountInWei: x.returnValues.amountInWei, 
                amountInTokens:x.returnValues.amountInToken,
                avgPricePerShare: x.returnValues.amountInWei / x.returnValues.amountInToken
            }
        });
    return eventsFormatted;
};

//A block is about 15 seconds
//To convert a block number to a time, we figure out how many seconds ago it was created
//(latestBlockNumber - blockNumber) * 15 and then subtract that from the current date
function calculateTimeStamp(blockNumber, latestBlockNumber){
    //How many seconds ago did it happen
    let secs = (latestBlockNumber - blockNumber) * AVG_BLOCK_TIME
    let now = Date.now()               //Gets current date as milliseconds since 1970
    let previous = now - (secs * 1000) //We figure out the previous date by calculating the block age in seconds, multiply by 1000, subtract from now

    //Return as a standard timestamp, caller can convert to Date if they wish
    return previous
}

//Convert our data series to the strange 2D array format required by Google Charts
function formatDataForGoogleCharts(rawData, callback){
    let dataset = []
    rawData.forEach((x) => {
        let pair = [new Date(x.timeStamp), x.avgPricePerShare]
        dataset.push(pair)
    })

    //And add the price today - if the last order was a long time ago, the graph will end there
    //this way we see a properly scaled price history up till today
    getCurrentPrice(exchangerAddress, exchangerABI).then((curprice) => {
        dataset.push([new Date(), curprice])
        callback(dataset) //Do whatever is next. Using a callback because otherwise dataset is a promise and google charts fails
    });

}

//The chart is included in an iframe, with querystring args specifying exchanger address, asset name,
//and the time span to go back
//
//For example: <iframe src="charter.html?address=0x0&days=14&name=TITAN"></iframe>
setTimeout(async() => {
    initWeb3();

    var data = await getPastEv(exchangerAddress, exchangerABI, parseInt(timeSpan));

    //Google expects an array of pairs for a time series graph
    formatDataForGoogleCharts(data, (formattedData) => {
        drawChart(formattedData, assetName, timeSpan)
    })
    

}, 1000);





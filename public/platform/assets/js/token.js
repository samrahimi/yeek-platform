let tokenstats = {airdropPending: false}
let pricing = {buy:0, sell:0}
let exchangeUI = {
    direction: "buy",
    maxSlippage: .05
}
let refreshDisplayData = () => {
    

    token = eth.contract(tokenABI, "", {"from": myAddress}).at(window.model.tokenAddress);
    dropper = eth.contract(dropperABI).at(window.model.dropperAddress);
    exchanger = eth.contract(exchangerABI, "", {"from": myAddress}).at(window.model.exchangerAddress)

    //Quote price is halfway btwn bid and ask
    let quotePrice = getQuotePriceForToken();

    $(".quote_price").html(quotePrice >0 ? quotePrice.toString().substring(0,10): "...");

    /* Begin load token info */
    token.totalSupply().then((totalSupply) => {
        tokenstats.totalSupply = totalSupply[0].toString(10);
        $(".totalSupply").html(rawToDecimal(tokenstats.totalSupply, 18));
    // result <BN ...>  4500000
    })

    token.symbol().then((sym) => {
        tokenstats.symbol = sym[0];
        $(".symbol").html(tokenstats.symbol);
        $(".etherscanUrl").attr("href", "https://etherscan.io/token/"+window.model.tokenAddress);
    })

    token.name().then((sym) => {
        tokenstats.name = sym[0];
        $(".tokenName").html(tokenstats.name);
    })
    token.decimals().then((val) => {
        tokenstats.decimals = val[0].toString(10);
        $("#decimals").html(tokenstats.decimals);
    })

    /* Begin Load User Balances */
    token.balanceOf(myAddress).then((balance) => {
        tokenstats.balance = balance[0].toString(10);
        $("#tokenBalance").html(rawToDecimal(tokenstats.balance, 18));
    })

    eth.getBalance(myAddress, (err, balance) => {
        var value = web3.fromWei(balance, 'ether');
        tokenstats.etherBalance = value.toString(10);
        $("#etherBalance").html(tokenstats.etherBalance);
    });
      
    /* Begin Load Airdropper Info */

    if (window.model.dropperAddress != '0x0') {
        dropper.tokensDispensed().then((amount) => {
            tokenstats.dispensed = amount[0].toString(10);
            $("#tokensDispensed").html(rawToDecimal(tokenstats.dispensed, 18));
        })

        dropper.tokensRemaining().then((amount) => {
            tokenstats.remaining = amount[0].toString(10);
            $("#tokensRemaining").html(rawToDecimal(tokenstats.remaining, 18));
        })

        dropper.numberOfTokensPerUser().then((amount) => {
            tokenstats.airdropsize = amount[0].toString(10);
            $("#airdropAmount").html(rawToDecimal(tokenstats.airdropsize, 18));
        })

        dropper.airdroppedUsers(myAddress).then((hasGottenAirdrop) => {
            if (hasGottenAirdrop[0]) {
                $("#eligibility").html("Already Received")
                $("#withdrawAirdropTokens").attr("disabled", "disabled")
            } else {
                //If they just requested the airdrop, don't confuse them
                if (!tokenstats.airdropPending) {
                    $("#eligibility").html("Hit Button For Tokens")
                    $("#withdrawAirdropTokens").removeAttr("disabled")
                }
            }
        })
    }

}

//Returns the mean buy and sell prices and async fetches updated values.
let getQuotePriceForToken = () => {
    if (window.model.exchangerAddress != '0x0') {
        //Get the buy price based on an 0.1 eth order
        exchanger.getPurchasePrice(decimalToRaw(0.1, 18)).then((totalTokens) => {
            let actualTokens = rawToDecimal(totalTokens[0].toString(10), 18);
            pricing.buy = 0.1/actualTokens; //If 1 eth gets you n tokens, each token is worth 1/n eth. 
            
        })

        //Get the sale price based on 100 tokens sold.
        exchanger.getSalePrice(decimalToRaw(100, 18)).then((amountInWei) => {
            let ether = rawToDecimal(amountInWei[0].toString(10), 18);
            pricing.sell = ether / 100;
        })

    }

    return (pricing.buy+pricing.sell) / 2
}

//Quotes a buy for the specific amount of eth
//Returns the total amount of tokens that eth can buy, not the price per tokens
async function convertToTokens(ethAmount) {
    var rawTokens = await exchanger.getPurchasePrice(decimalToRaw(ethAmount, 18));
    let actualTokens = rawToDecimal(rawTokens[0].toString(10), 18);
    return actualTokens;
}

async function convertToEther(tokenAmount) {
    var amountInWei = await exchanger.getSalePrice(decimalToRaw(tokenAmount, 18));
    let amountInWei = rawToDecimal(amountInWei[0].toString(10), 18);
    return amountInWei;
}

$("#convertFrom").on('change', () => {
    try {
        let func= exchangeUI.direction == "buy" ? convertToTokens : convertToEther
        func($("#convertFrom").val()).then((amount) => {
            $("#convertTo").val(amount);
            let unitPrice = exchangeUI.direction == "buy" ? $("#convertFrom").val() / amount :
                            amount / $("#convertFrom").val()
            let btnString = (exchangeUI.direction == "buy" ? "Buy @ "+unitPrice.substring(0, 8): "Sell @ "+unitPrice.substring(0, 8))
            $("#tradeBtn").html(btnString)
        })
    } catch(x)
    {
        console.log("Realtime converter: invalid number entry or blockchain connection error")
    }
})
//Init function / entry point. Call from main document ready method 
//after data has been pulled from db and is available on window.model
let bindTokenData = () => {

    setTimeout(() => {
        if (typeof web3 == 'undefined') {
            $("#needMetamask").show();
            return;
        }

        myAddress = window.web3.eth.defaultAccount;
        eth = new Eth(window.web3.currentProvider);

        if (window.model.dropperAddress != '0x0') {
            $("#withdrawAirdropTokens").on("click", () => {
                console.log("main.js 557: Withdraw Button Clicked")
                $("#eligibility").html("Please authorize the transaction in your wallet to continue...")
                $("#withdrawAirdropTokens").attr("disabled", "disabled")
    
                dropper.withdrawAirdropTokens({"from": myAddress}).then((tx) => {
                        $("#eligibility").html("Transaction Processing: <a href='https://etherscan.io/tx/"+ tx+"'>"+tx+"</a>");
                        tokenstats.airdropPending = true;
                })
            })
        }
    
    
        $('#sendTokens').on('click', function(){
            $("#sendResponse").show();
            $("#sendResponse").html("Submitted: Please confirm the transaction in Metamask");
            token.transfer(
                $('#sendTo').val(), 
                decimalToRaw($('#sendAmount').val(), tokenstats.decimals)
            )
            .then(function(transferTxHash) {
              $("#sendResponse").removeClass("text-info").addClass("text-success");
              $('#sendResponse').html('Sent. Tx: <a href="https://etherscan.io/tx/' + String(transferTxHash)+'">'+String(transferTxHash)+"</a>");
            })
            .catch(function(transferError) {
              $("#sendResponse").removeClass("text-info").addClass("text-error");
              $('#sendResponse').html('Error:' + String(transferError));
            });

            return false;
          });

        console.log("Account: "+myAddress);
        $(".ethAddress").html(myAddress.substring(0,10)+"...");

        refreshDisplayData();
        //Poll the blockchain, refresh the display
        setInterval(refreshDisplayData, 10000)
    }, 1000)
}

let tokenstats = { airdropPending: false }
let pricing = { buy: 0, sell: 0, quote: 0 }
let exchangeUI = {
    direction: "buy",
    maxSlippage: .05,
    readonly: false
}

let bindContractFieldToElement = (methodCall, postProcessingFunction, el) => {
    if (typeof web3 == 'undefined') {
        el.html('...');
        return;
    }

    eval(methodCall).then((RESULT) => {
        let finalResult = eval(postProcessingFunction);
        el.html(finalResult)
    })
}

let refreshDisplayData = () => {
    //Connect to the smart contracts. We only need to do this once.
    if (token == null) {
        if (!exchangeUI.readonly) {
            token = eth.contract(tokenABI, "", { "from": myAddress }).at(window.model.tokenAddress);
            dropper = eth.contract(dropperABI, "", { "from": myAddress }).at(window.model.dropperAddress);
            exchanger = eth.contract(exchangerABI, "", { "from": myAddress }).at(window.model.exchangerAddress)
        }
        else {
            token = eth.contract(tokenABI).at(window.model.tokenAddress);
            dropper = eth.contract(dropperABI).at(window.model.dropperAddress);
            exchanger = eth.contract(exchangerABI).at(window.model.exchangerAddress)

            disableTradingUI();
        }
    }
    //Gets the previous quote and fetches the next one - the UI is bound to the updated value inside getQuotePriceForToken
    pricing.quote = getQuotePriceForToken();

    //Gets weight, balances from the exchanger and calculates market cap.
    updateReserveBalances()

    //Gets basic info about the token
    updateTokenInfo();

    /* Begin Load User Balances */
    if (!exchangeUI.readonly)
        updateUserBalances()
    else
        $("#userBalances").hide();

    /* Begin Load Airdropper Info */

    if (window.model.dropperAddress != '0x0') {
        updateDropperUI();
    }

}

let disableTradingUI = () => {
    $(".tradingUI button").attr("disabled", "disabled");
}

let updateUserBalances = () => {
    token.balanceOf(myAddress).then((balance) => {
        tokenstats.balance = balance[0].toString(10);
        $("#tokenBalance").html(rawToDecimal(tokenstats.balance, 18));
    })

    web3.eth.getBalance(myAddress, (err, balance) => {
        let wei = balance.toString(10);
        tokenstats.etherBalance = rawToDecimal(wei,18);
        //tokenstats.etherBalance = value.toString(10);
        $("#etherBalance").html(tokenstats.etherBalance);
    });
}

let updateTokenInfo = () => {
    /* Begin load token info */
    token.totalSupply().then((totalSupply) => {
        tokenstats.totalSupply = totalSupply[0].toString(10);
        $(".totalSupply").html(rawToDecimal(tokenstats.totalSupply, 18));
        // result <BN ...>  4500000
    })

    token.name().then((sym) => {
        tokenstats.name = sym[0];
        $(".tokenName").html(tokenstats.name);
    })
    token.decimals().then((val) => {
        tokenstats.decimals = val[0].toString(10);
        $("#decimals").html(tokenstats.decimals);
    })

}

//Gets status of the airdrop, if an airdropper contract is present
let updateDropperUI = () => {

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

//Returns the mean buy and sell prices and async fetches updated values.
let getQuotePriceForToken = () => {
    if (window.model.exchangerAddress != '0x0') {
        //Get the buy price based on an 0.00001 eth order
        exchanger.getPurchasePrice(decimalToRaw(0.1, 18)).then((totalTokens) => {
            let actualTokens = rawToDecimal(totalTokens[0].toString(10), 18);
            pricing.buy = 0.1 / actualTokens; //If 1 eth gets you n tokens, each token is worth 1/n eth. 

            //Get the sale price based on selling n tokens back
            exchanger.getSalePrice(decimalToRaw(actualTokens, 18)).then((amountInWei) => {
                let ether = rawToDecimal(amountInWei[0].toString(10), 18);
                pricing.sell = ether / actualTokens;

                let newQuotePrice = (pricing.buy + pricing.sell) / 2
                $(".quote_price").html(newQuotePrice.toFixed(5));
            })
        })
    }

    return (pricing.buy + pricing.sell) / 2
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
    let amountInEther = rawToDecimal(amountInWei[0].toString(10), 18);
    return amountInEther;
}

async function updateReserveBalances() {
    exchanger.getReserveBalances().then(x => {
        exchangeUI.reserve_balance_tokens = rawToDecimal(x[0].toString(10), 18)
        exchangeUI.reserve_balance_ether = rawToDecimal(x[1].toString(10), 18)
        exchanger.weight().then(rawWeight => {
            exchangeUI.reserve_weight = rawWeight[0].toString(10);

            //Market cap: reserve balance in ether / reserve weight as a fraction
            exchangeUI.market_cap = exchangeUI.reserve_balance_ether / (exchangeUI.reserve_weight / 1000000);
            $(".reserve_weight").html((exchangeUI.reserve_weight / 1000000) * 100); //PPM to pct conversion
            $(".reserve_balance").html(exchangeUI.reserve_balance_ether);
            $(".reserve_balance_tokens").html(exchangeUI.reserve_balance_tokens);
            $(".market_cap").html(exchangeUI.market_cap.toFixed(3));
        })
    })

}

//Init function / entry point. Call from main document ready method 
//after data has been pulled from db and is available on window.model
let bindTokenData = () => {

    setTimeout(() => {

        //If web3 doesn't exist, it means the user is missing a necessary browser-plugin wallet
        //or is using a mobile browser without web3 support. We explain it to them, put the 
        //app in read only mode, and continue.
        if (typeof web3 == 'undefined') {
            $("#wallet_warning").modal('show');
            exchangeUI.readonly = true;
            myAddress = "0x0"
            window.web3 = new Web3(new Web3.providers.HttpProvider("https://infura.io/MEDIUMTUTORIAL"))

        }
        else {
            myAddress = window.web3.eth.defaultAccount;

            //Even if web3 is defined, the user may not be logged in
            //In either case, we go into read only mode, and connect to our fallback Ethereum node
            //which will do everything except sending tokens and executing trades
            if (typeof myAddress == 'undefined' || myAddress == null) {
                $("#wallet_login_warning").modal('show');
                exchangeUI.readonly = true;
                myAddress = "0x0"
                window.web3 = new Web3(new Web3.providers.HttpProvider("https://infura.io/MEDIUMTUTORIAL"))
            }
        }


        //ethjs is a convenience library that wraps a lot of the more clunky web3 features
        eth = new Eth(window.web3.currentProvider);

        //set up the airdropper UI events if the token owner is doing an airdrop
        if (window.model.dropperAddress != '0x0') {
            $("#withdrawAirdropTokens").on("click", () => {
                console.log("main.js 557: Withdraw Button Clicked")
                $("#eligibility").html("Please authorize the transaction in your wallet to continue...")
                $("#withdrawAirdropTokens").attr("disabled", "disabled")

                dropper.withdrawAirdropTokens({ "from": myAddress }).then((tx) => {
                    $("#eligibility").html("Transaction Processing: <a href='https://etherscan.io/tx/" + tx + "'>" + tx + "</a>");
                    tokenstats.airdropPending = true;
                })
            })
        }


        $('#sendTokens').on('click', function () {
            $("#sendResponse").show();
            $("#sendResponse").html("Submitted: Please confirm the transaction in Metamask");
            token.transfer(
                $('#sendTo').val(),
                decimalToRaw($('#sendAmount').val(), tokenstats.decimals)
            )
                .then(function (transferTxHash) {
                    $("#sendResponse").removeClass("text-info").addClass("text-success");
                    $('#sendResponse').html('Sent. Tx: <a href="https://etherscan.io/tx/' + String(transferTxHash) + '">' + String(transferTxHash) + "</a>");
                })
                .catch(function (transferError) {
                    $("#sendResponse").removeClass("text-info").addClass("text-error");
                    $('#sendResponse').html('Error:' + String(transferError));
                });

            return false;
        });

        $(document).on("click", "#tradeBtn", () => {
            if (exchangeUI.direction == "buy") {
                buy(parseFloat($("#convertFrom").val()));
            } else {
                sell(parseFloat($("#convertFrom").val()));
            }
        });

        $(document).on("click", "#swapBuySell", () => {
            let amt = $("#convertTo").val();

            if (exchangeUI.direction == "buy") {
                exchangeUI.direction = "sell";
                $("#convertFrom, #convertTo").val('');
                $("#convertFrom").attr("placeholder", tokenData.symbol)
                $("#convertTo").attr("placeholder", "ETH")
                $("#tradeBtn").html("Sell")
                $("#tradeBtn").removeClass("btn-success").addClass("btn-warning")

            } else {
                exchangeUI.direction = "buy";
                $("#convertFrom, #convertTo").val('');
                $("#convertTo").attr("placeholder", tokenData.symbol)
                $("#convertFrom").attr("placeholder", "ETH")
                $("#tradeBtn").html("Buy")
                $("#tradeBtn").addClass("btn-success").removeClass("btn-warning")

            }

            $("#convertFrom").val(amt); //Swap the values;
            $("#convertFrom").change(); //Trigger the onchange event;

            return false;
        })

        $(document).on('keyup change', "#convertFrom", () => {

            //Don't try to convert a non number
            if (isNaN($("#convertFrom").val()) || $("#convertFrom").val() == "")
                return;

            try {
                let v = parseFloat($("#convertFrom").val())

                if (v <= 0) {
                    $("#convertTo").val("0");
                    return;
                }

                let func = exchangeUI.direction == "buy" ? convertToTokens : convertToEther
                func(v).then((amount) => {
                    $("#convertTo").val(amount.toString().substring(0, 10));
                    let unitPrice = exchangeUI.direction == "buy" ? v / amount :
                        amount / v
                    let btnString = (exchangeUI.direction == "buy" ? "Buy @ " + unitPrice.toString().substring(0, 8) :
                        "Sell @ " + unitPrice.toString().substring(0, 8))
                    $("#tradeBtn").html(btnString)
                    if (!exchangeUI.readonly)
                        $("#tradeBtn").removeAttr("disabled");
                })
            } catch (x) {
                $("#convertTo").val("Error");
                console.log("Realtime converter: invalid number entry or blockchain connection error")
                $("#tradeBtn").attr("disabled");
            }

        })




        console.log("Account: " + myAddress);
        $(".ethAddress").html(myAddress.substring(0, 10) + "...");

        refreshDisplayData();
        //Poll the blockchain, refresh the display
        setInterval(refreshDisplayData, 5000)
    }, 1000)
}

/* CALL THIS TO PLACE A BUY ORDER WITH ANY EXCHANGER */
async function buy(amountInEther) {
    $(".alert").hide();
    $(".alert-warning").show();

    //todo validation of input
    let valueInWei = decimalToRaw(amountInEther, 18)
    let minPurchaseReturn = valueInWei * (1 - exchangeUI.maxSlippage);

    console.log(`Value:${valueInWei}, Limit:${minPurchaseReturn}`);

    exchanger.buy(minPurchaseReturn, {
        "from": myAddress,
        "value": valueInWei
    }).then((tx) => {
        $(".alert").hide();
        $(".alert-success").html("Transaction Processing: <a href='https://etherscan.io/tx/" + tx + "'>" + tx + "</a>");
        $(".alert-success").show();
    }).catch((err) => {
        $(".alert").hide();
        $(".alert-error").show();
        console.log(String(transferError))
    })

}
async function sell(amountInTokens) {
    console.log("sell");
    let rawTokens = decimalToRaw(amountInTokens, 18)
    //let minSaleReturn = rawTokens * (1 - exchangeUI.maxSlippage);
    let minSaleReturn = 0

    $(".alert").hide();
    $(".alert-warning").show();

    token.approve(window.model.exchangerAddress, rawTokens).then((tx) => {
        exchanger.sell(rawTokens, minSaleReturn).then((tx) => {
            $(".alert").hide();
            $(".alert-success").html("Transaction Processing: <a href='https://etherscan.io/tx/" + tx + "'>" + tx + "</a>");
            $(".alert-success").show();
        })
    })
}


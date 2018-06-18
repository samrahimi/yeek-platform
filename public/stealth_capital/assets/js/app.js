window.db = firebase.firestore();

$(document).ready(() => {
    const tokenAddress = queryString("token_address") || '0x96387e69fac1d3b63e31a3a70ee3a06761887759';
    const formulaAddress = "0x3ae6abeb18dfa61f85faff25aef28c8cd6ddbe6b"; //MAINNET!
    //db.collection("listed_tokens").doc(tokenAddress).get().then((doc) => {
        //Declarative import of HTML web controls using <ctrl> tag
        //window.tokenData = doc.data();
        window.tokenData = window.token_list.filter(x => x.contract_address == tokenAddress)[0] //from data/token_list.js
        console.log("found listing for token "+tokenAddress);

        window.model =
        {
            tokenAddress: tokenAddress,
            dropperAddress: tokenData.airdropper_address,
            exchangerAddress: tokenData.exchanger_address,
            menuData: {
                topLevel: ["Exchange (Alpha)", "How It Works"],
                pageTitle: "Stealth Capital Holdings",
                pageDescription: "Buy, sell, and trade asset-backed tokens on the Blockchain.",
                tokenAddress: tokenAddress,
                dropperAddress: tokenData.airdropper_contract,
                exchangerAddress: tokenData.exchanger_contract
            }
        }
        renderDefaultEjsTemplate(model);
        loadControls(model);

        bindTokenData();
        /*
        window.disqus_config = function () {
                this.page.url = "https://yeek-platform.firebaseapp.com/platform/token/"+tokenData.symbol
                this.page.identifier = tokenData.symbol // Replace PAGE_IDENTIFIER with your page's unique identifier variable
                this.page.title = tokenData.company_info.name;
        };

        DISQUS();*/
    //})
})

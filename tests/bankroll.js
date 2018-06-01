let betFactor = .001;
let bankroll = .1
let payout = 2
let count = 0;
while (bankroll < .2) {
    var curBet = bankroll * betFactor
    console.log("Bet: "+curBet+"\t Bankroll:"+bankroll)
    bankroll += (curBet * payout) - curBet
    count++
}

console.log(count)
let optimalStake = ((2 * 0.66)-1);

let baseBetPct = .1;           //Amount of bankroll to wager after a win

//let martingaleMultiplier = 3;   //Multiply previous bet by this number after a loss
//we'll assume the player is doing a martingale that recovers the initial loss and no more
//that way we can just measure the length of the losing streak

//let maxLosingStreak = 7;
let martingaleMultiplier =3;               //Multiply previous bet by this number after a loss
let goal =.2                               //How much do you want to make
let payout = 2                         //How much do you make on a winning bet
let odds = 0.495                             //Chance of winning each time

let maxRuns = 10000;                   //A run ends when the player is bankrupt or they've met their goal
let winningRuns=0, losingRuns = 0;    //For tracking success
let earnings = 0;
let expenses = 0;

for (var runs=0; runs<maxRuns; runs++) {
    let count = 0;                      //Total winning bets placed
    let currentLosingStreak=0;          //Used when a player starts losing
    let bankroll = .1                    //How much money are you starting with
    var curBet = bankroll * baseBetPct  //Start off with a base wager

    while (bankroll < goal && bankroll > 0) {
        let win = (Math.random() <= odds)
        if (win) {
            bankroll += (curBet * payout) - curBet
            currentLosingStreak = 0;
            curBet = bankroll * baseBetPct;
            //curBet = goal / 5 * baseBetPct;
        }
        else
        {
            bankroll -= curBet;
            curBet *= martingaleMultiplier;
            if (curBet > bankroll)
                curBet = bankroll; //Go all in at the end
            currentLosingStreak++
        }
        count++;
    }
    if (bankroll >= goal)
    {
        console.log("Goal Achieved: "+count+" bets made.")
        earnings += bankroll;
        winningRuns++;
    } else {
        console.log("Bankrupted after "+count+"bets.")    
        expenses += .1
        losingRuns++;
    }
        
}

console.log(`\n\nWins: ${winningRuns}\nLosses: ${losingRuns}`)
console.log(`\nEarnings: ${earnings}, Expenses: ${expenses}`);
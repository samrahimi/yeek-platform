The Charter is a self-contained application that renders a price history chart for any token listed on the exchange.

It can be included in any web page using an iframe, specifying the exchanger contract address, the symbol (name of the token), and the number of days to display.

Example: <iframe src="chart.html?address=0x...&name=TITAN&days=7"></iframe> shows the price of Titan for the last 7 days.

The chart will fill the iframe's width and height, so you can control that simply by sizing the iframe.


KNOWN ISSUES:

Loading takes a long time (~15 seconds)
Data is not cached, so changing the timespan, etc. requires a full reload
Occasionally the web3 connector fails to query the blockchain, and the data is not available. We do not retry, so you must check it yourself.
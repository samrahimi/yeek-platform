
let private_key = "despair happy flag quarter robot expect anxiety stone borrow sail will immune" //There's real money here, do NOT deploy this key!
let HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    live: {
      provider: function() {
        return new HDWalletProvider(private_key, "https://mainnet.infura.io/yQKGJVARKy6KfaHEJmy8");
      },
      network_id: '1',
    }
  }
};

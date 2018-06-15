var Exchanger = artifacts.require("../contracts/yeek_formula/exchanger.sol");

var weight = 50000;
var _token_adr = 0x627306090abab3a6e1400e9345bc60c78a8bef57; // generated in truffle develop
var _formulaContract_adr = 0xf17f52151ebef6c7334fad080c5704d77216b732; // generated in truffle develop

contract('Exchanger', function(accounts){

    it("should have 50000 in weight variable if initialized correctly", function(){
        return Exchanger.deployed().then(function(instance){
            return instance.weight.call();
        }).then(function(weight) {
            assert.equal(weight.valueOf(), 50000, "50000 was not value in weight var");
          });
    });
});
// file used to deploy contracts for testing purposes in truffle
var Exchanger = artifacts.require("Exchanger");
var Administered = artifacts.require("Administered");
var Utils = artifacts.require("Utils");
var YeekFormula = artifacts.require("YeekFormula");

var weight = 50000;
var _token_adr = 0x627306090abab3a6e1400e9345bc60c78a8bef57; // generated in truffle develop
var _formulaContract_adr = 0xf17f52151ebef6c7334fad080c5704d77216b732; // generated in truffle develop

module.exports = function(deployer) {

    deployer.deploy(Utils);
    deployer.deploy(YeekFormula);
    
    deployer.deploy(Administered);
    deployer.deploy(Exchanger, _token_adr, weight, _formulaContract_adr);
};
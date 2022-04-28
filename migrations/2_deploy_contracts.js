const FoxBotCoin = artifacts.require("FoxBotCoin");
const FoxBotCoinSale = artifacts.require("FoxBotCoinSale");

module.exports = function(deployer) {
  //deployer.deploy(FoxBotCoin);
  //deployer.link(FoxBotCoin, FoxBotCoinSale);
  //deployer.deploy(FoxBotCoinSale);
  deployer.deploy(FoxBotCoin, 1000000).then(function() {
    // Token price is 0.001 Ether
    var tokenPrice = 1000000000000000;
    return deployer.deploy(FoxBotCoinSale, FoxBotCoin.address, tokenPrice);
  });
};

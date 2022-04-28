App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',
  loading: false,
  tokenPrice: 1000000000000000,
  tokensSold: 0,
  tokensAvailable: 750000,
  foxBotCoinSaleInstance: null,
  foxBotCoinInstance: null,


  init: function() {
    console.log("App initialized...")
    return App.initWeb3();
  },

  initWeb3: async function() {
    
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
      } catch (error) {
        // User denied account access...
        console.error("User denied account access")
      }
    }

    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }

    else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
      
    }
    web3 = new Web3(App.web3Provider);

    return App.initContracts();
  },

  initContracts: function() {
    $.getJSON("FoxBotCoinSale.json", function(foxBotCoinSale) {
      App.contracts.FoxBotCoinSale = TruffleContract(foxBotCoinSale);
      App.contracts.FoxBotCoinSale.setProvider(App.web3Provider);
      App.contracts.FoxBotCoinSale.deployed().then(function(foxBotCoinSale) {
        console.log("FoxBot Coin Sale Address:", foxBotCoinSale.address);
      });
    }).done(function() {
      $.getJSON("FoxBotCoin.json", function(foxBotCoin) {
        App.contracts.FoxBotCoin = TruffleContract(foxBotCoin);
        App.contracts.FoxBotCoin.setProvider(App.web3Provider);
        App.contracts.FoxBotCoin.deployed().then(function(foxBotCoin) {
          console.log("FoxBot Coin Address:", foxBotCoin.address);
        });

        App.listenForEvents();
        return App.render();
      });
    })
  },

  // Listen for events emitted from the contract
  listenForEvents: function() {
    App.contracts.FoxBotCoinSale.deployed().then(function(instance) {
      instance.Sell({}, {
        fromBlock: 0,
        toBlock: 'latest',
      }).watch(function(error, event) {
        console.log("event triggered", event);
        App.render();
      })
    })
  },

  render: function() {
    if (App.loading) {
      return;
    }
    App.loading = true;

    var loader  = $('#loader');
    var content = $('#content');

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if(err === null) {
        App.account = account;
        console.log("Your Account: " + account);
        $('#accountAddress').html("Your Account: " + account);
      }
    })

    // Load token sale contract
    App.contracts.FoxBotCoinSale.deployed().then(async function(instance) {
      App.foxBotCoinSaleInstance = instance;
      // var x = await instance.tokenPrice();
      // console.log(instance);
      console.log("instance of token price",await instance.tokenPrice());
      return instance.tokenPrice();

    }).then(function(tokenPrice) {
      App.tokenPrice = tokenPrice;
      console.log("tokenPrice",tokenPrice);
      $('.token-price').html(web3.fromWei(App.tokenPrice, "ether").toNumber());
      return App.foxBotCoinSaleInstance.tokensSold();
    }).then(function(tokensSold) {
      App.tokensSold = tokensSold.toNumber();
      console.log("tokensSold",tokensSold);
      $('.tokens-sold').html(App.tokensSold);
      $('.tokens-available').html(App.tokensAvailable);

      var progressPercent = (Math.ceil(App.tokensSold) / App.tokensAvailable) * 100;
      $('#progress').css('width', progressPercent + '%');

      // Load token contract
      App.contracts.FoxBotCoin.deployed().then(function(instance) {
        App.foxBotCoinInstance = instance;
        return instance.balanceOf(App.account);
      }).then(function(balance) {
        $('.fbc-balance').html(balance.toNumber());
        console.log("balance: " + balance.toNumber());
        App.loading = false;
        loader.hide();
        content.show();
      })
    });
  },

  buyTokens: function() {
    $('#content').hide();
    $('#loader').show();
    var numberOfTokens = $('#numberOfTokens').val();
    console.log(numberOfTokens)
    App.contracts.FoxBotCoinSale.deployed().then(function(instance) {
      return instance.buyTokens(numberOfTokens, {
        from: App.account,
        value: numberOfTokens * App.tokenPrice,
        gas: 500000 // Gas limit
      });
    }).then(function(result) {
      console.log("Tokens bought...")
      $('form').trigger('reset') // reset number of tokens in form
      // Wait for Sell event
    });
  }
}

$(function() {
  $(window).load(function() {
    App.init();
  })
});

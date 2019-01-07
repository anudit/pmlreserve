var kyberRopstenTokensJSON = "";
var kyberRopstenTokenList = [];
var ADD_KyberNetwork = "0x91a502C678605fbCe581eae053319747482276b9"
var ADD_PmlOrderbookReserveLister = "0x405a5fae110c86eb2e5a76809a17fc5bee2d3ccd"
var ADD_OrderbookReserve = "0x82a428804514ECef24879c2fF24718F08a55cDcC"
var ADD_ZERO = "0x0000000000000000000000000000000000000000"

function structFactory(names) {
	var names = names.split(' ');
	var count = names.length;

	function constructor() {
		for (var i = 0; i < count; i++) {
			this[names[i]] = arguments[i];
		}
	}
	return constructor;
}
var Tok = structFactory("cmcName contractAddress decimals name symbol pml reserveAddress");

function init() {
	$.getJSON("./json/kyberRopsten.json", function(result) {
			kyberRopstenTokensJSON = result;
		})
		.fail(function() {
			alert("[ERROR] Token Addresses Not Loaded");
		});
}

window.addEventListener('load', async() => {
	if (window.ethereum) {
		window.web3 = new Web3(ethereum);
		try {
			await ethereum.enable();
		} catch (error) {
			console.log(error);
		}
	} else if (window.web3) {
		window.web3 = new Web3(web3.currentProvider);
	} else {
		web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/8f68025ea6a8425cb75ae44591a8b1b3"));
	}

	init();
});

web3.eth.defaultAccount = web3.eth.accounts[0];

var KyberNetworkContract = web3.eth.contract(ABI_KyberNetworkContract);
var KyberNetwork = KyberNetworkContract.at(ADD_KyberNetwork);

var PermissionlessOrderbookReserveListerContract = web3.eth.contract(ABI_PmlOrderbookReserveLister);
var PermissionlessOrderbookReserveLister = PermissionlessOrderbookReserveListerContract.at(ADD_PmlOrderbookReserveLister);

var OrderbookReserveContract = web3.eth.contract(ABI_OrderbookReserve);
var OrderderbookContract = OrderbookReserveContract.at(ADD_OrderbookReserve);

function isPML(obj) {
	PermissionlessOrderbookReserveLister.reserves(obj.contractAddress, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			if (res != ADD_ZERO) {
				var t1 = new Tok(obj.cmcName, obj.contractAddress, obj.decimals, obj.name, obj.symbol, true, res);
				kyberRopstenTokenList.push(t1);
			} else {
				var t1 = new Tok(obj.cmcName, obj.contractAddress, obj.decimals, obj.name, obj.symbol, false, ADD_ZERO);
				kyberRopstenTokenList.push(t1);
			}
		}
	})
}

function getValidPmlReserves() {
	var keys = Object.keys(kyberRopstenTokensJSON);
	var tem = 0;
	for (tem = 0; tem < keys.length; tem++) {
		isPML(kyberRopstenTokensJSON[keys[tem]]);
	}
}

function addOrderbookContract(add) {
	PermissionlessOrderbookReserveLister.addOrderbookContract(add, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			console.log(res)
			stage = 1
		}
	})
}

function initOrderbookContract(add) {
	PermissionlessOrderbookReserveLister.initOrderbookContract(add, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			console.log(res)

		}
	})
}

function listOrderbookContract(add) {
	PermissionlessOrderbookReserveLister.listOrderbookContract(add, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			console.log(res)

		}
	})
}

function createOrderBook(add) {
	PermissionlessOrderbookReserveLister.addOrderbookContract(add, (err, res) => {
		if (err) {
			console.log(err);
		} else {
			var payObj = {
				gasPrice: 750000
			}

			PermissionlessOrderbookReserveLister.initOrderbookContract(add, payObj, (err, res) => {
				if (err) {
					console.log(err);
				} else {

					var payObj = {
						gasPrice: 750000
					}

					PermissionlessOrderbookReserveLister.listOrderbookContract(add, payObj, (err, res) => {
						if (err) {
							console.log(err);
						} else {
							console.log(res)

						}
					})
				}
			})
		}
	})


	// addOrderbookContract(add);
	// initOrderbookContract(add);
	// listOrderbookContract(add);
}


var filterName = ""

function filter(obj) {
	return obj.cmcName == filterName;
}

function returnTokenDetails(cmcName) {
	filterName = cmcName
	return kyberRopstenTokenList.find(filter);
}

function provideAllowance(cmcName) {
	var coinDetails = returnTokenDetails(cmcName);
	if (coinDetails) {
		var CoinContract = "";
		var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.contractAddress
		$.getJSON(etherscanUrl, function(result) {
			CoinContract = web3.eth.contract(JSON.parse(result.result));
			var Coin = CoinContract.at(coinDetails.contractAddress);
			Coin.approve(coinDetails.reserveAddress, web3.toWei(10000, 'ether'), (err, res) => {
				if (err) {
					console.log(err);
				} else {
					console.log(res)
					console.log("Done!")
				}
			})
		});
	} else {
		console.log("Invalid Coin")
	}
}

function checkAllowance(cmcName) {

	var coinDetails = returnTokenDetails(cmcName);
	if (coinDetails) {
		var CoinContract = "";
		var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.contractAddress
		$.getJSON(etherscanUrl, function(result) {
			CoinContract = web3.eth.contract(JSON.parse(result.result));
			var Coin = CoinContract.at(coinDetails.contractAddress);
			Coin.allowance(web3.eth.defaultAccount, coinDetails.reserveAddress, (err, res) => {
				if (err) {
					console.log(err);
				} else {
					if (res.c[0] == 0) {
						provideAllowance(cmcName);
					} else {
						console.log("Allowance Already Provided.")
					}
				}
			})
		});
	} else {
		console.log("Invalid Coin.")
	}
}
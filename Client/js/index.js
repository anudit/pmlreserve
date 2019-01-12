var kyberRopstenTokensJSON = "";
var kyberRopstenTokenList = [];
var ADD_KyberNetwork = "0x91a502C678605fbCe581eae053319747482276b9"
var ADD_PmlOrderbookReserveLister = "0x405a5fae110c86eb2e5a76809a17fc5bee2d3ccd"
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
var EthToTokenOrder = structFactory("maker srcAmount dstAmount");

function init() {
	$.getJSON("./json/kyberRopsten.json", function(result) {
            kyberRopstenTokensJSON = result;
            initReserves();
            console.log("Done Loading Reserve List");
		})
		.fail(function() {
			alert("[ERROR] Token Addresses Not Loaded");
        });
    
    
}

var KyberNetworkContract = "";
var KyberNetwork = "";

var PermissionlessOrderbookReserveListerContract = "";
var PermissionlessOrderbookReserveLister = "";

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
    
    web3.eth.defaultAccount = web3.eth.accounts[0];

    KyberNetworkContract = web3.eth.contract(ABI_KyberNetworkContract);
    KyberNetwork = KyberNetworkContract.at(ADD_KyberNetwork);

    PermissionlessOrderbookReserveListerContract = web3.eth.contract(ABI_PmlOrderbookReserveLister);
    PermissionlessOrderbookReserveLister = PermissionlessOrderbookReserveListerContract.at(ADD_PmlOrderbookReserveLister);

	init();
});


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

function initReserves() {
    kyberRopstenTokenList = [];
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

function getTokenDetails(cmcName) {
    filterName = cmcName
    if (kyberRopstenTokenList.find(filter)){
        return kyberRopstenTokenList.find(filter);
    }
    else{
        return false;
    }
}

function provideAllowance(cmcName) {
	var coinDetails = getTokenDetails(cmcName);
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
    
    // Check if the reserve has the allowance to spend the coin
    
    var coinDetails = getTokenDetails(cmcName);
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
    
    // Check if the reserve has the allowance to spend KNC

    coinDetails = getTokenDetails("KNC");
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
						provideAllowance("KNC");
					} else {
						console.log("Allowance Already Provided.")
					}
				}
			})
		});
	} else {
		console.log("Invalid Coin.")
    }

    // and Finally Deposit the fees

    depositKncForFee(cmcName);

}

function depositKncForFee(cmcName){
    coinDetails = getTokenDetails(cmcName);
    if (coinDetails) {
		var CoinReserveContract = "";
		var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
		$.getJSON(etherscanUrl, function(result) {
			CoinReserveContract = web3.eth.contract(JSON.parse(result.result));
			var CoinReserve = CoinReserveContract.at(coinDetails.contractAddress);
			CoinReserve.depositKncForFee(web3.eth.defaultAccount, 10000000000000000000000 , (err, res) => {
				if (err) {
					console.log(err);
				} else {
					console.log(res);
				}
			})
		});
	} else {
		console.log("Invalid Coin.")
    }
}

function addToken(contractAddress){
    var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=account&action=tokentx&contractaddress=" + contractAddress + "&page=1&offset=1" ;

    $.getJSON(etherscanUrl, function(result) {
        var temp = result.result[0];
        var tokenSymbol = temp.tokenSymbol;
        if (!getTokenDetails(temp.tokenSymbol)){
            PermissionlessOrderbookReserveLister.reserves(contractAddress, (err, res) => {
                if (err) {
                    console.log(err);
                } else {
                    if (res != ADD_ZERO) {
                        var t = new Tok(tokenSymbol, contractAddress, temp.tokenDecimal, temp.tokenName, tokenSymbol, true, res);
                        kyberRopstenTokenList.push(t);
                    } else {
                        var t = new Tok(tokenSymbol, contractAddress, temp.tokenDecimal, temp.tokenName, tokenSymbol, false, ADD_ZERO);
                        kyberRopstenTokenList.push(t);
                    }
                }
            })
        }
    });
}

function depositToken(cmcName, amt){

    var coinDetails = getTokenDetails(cmcName);
	if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            console.log(etherscanUrl);
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                console.log(Reserve);
                Reserve.depositToken(web3.eth.defaultAccount, amt, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })
            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}

function withdrawToken(cmcName, amt){

    var coinDetails = getTokenDetails(cmcName);
	if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            console.log(etherscanUrl);
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                console.log(Reserve);
                Reserve.withdrawToken(amt, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })
            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}

function depositEther(cmcName, amt){

    var coinDetails = getTokenDetails(cmcName);
	if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            console.log(etherscanUrl);
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                console.log(Reserve);
                Reserve.depositEther(amt, web3.eth.defaultAccount, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })
            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}

function withdrawEther(cmcName, amt){

    var coinDetails = getTokenDetails(cmcName);
	if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            console.log(etherscanUrl);
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                console.log(Reserve);
                Reserve.withdrawEther(amt, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })
            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}


/*

cmcName: "PML"
contractAddress: "0x8a9A3a59EbA6cA45D51ee6F3B33D5c4aDb5F52dc"
decimals: "13"
name: "PERMISSIONLESS"
pml: true
reserveAddress: "0x496a2a8f0512d9610cfda8ac40238e133a23a4dc"
symbol: "PML"

*/

function getBalance(cmcName){
    var coinDetails = getTokenDetails(cmcName);
    if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);

                Reserve.getBalance(coinDetails.contractAddress, web3.eth.defaultAccount, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        alert(res);
                    }
                })

            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}

/* Eth To Token Functions */

var EthToTokenOrderListLength = 0;
var EthToTokenOrderList = [];
var EthToTokenOrderIndicies = [];
var tokenToUsdResult = 0;

function getEthToTokenOrder(cmcName){
    getEthToTokenOrderList(cmcName);
    var coinDetails = getTokenDetails(cmcName);
    if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                var i=0;
                for(i=0; i<=EthToTokenOrderListLength; i++){
                    Reserve.getEthToTokenOrder(EthToTokenOrderIndicies[i], (err, res) => {
                        if (err) {
                            console.log(err);
                        } else {
                            if(res[0] != ADD_ZERO){
                                var srcAmt = (res[1].c[0] / (10 ** ((res[1].c[0].toString().length) - 1)))  * (10 ** res[1].e)
                                var destAmt = (res[2].c[0] / (10 ** ((res[2].c[0].toString().length) - 1)))  * (10 ** res[2].e)
                                var ord = new EthToTokenOrder(res[0], srcAmt, destAmt);
                                EthToTokenOrderList.push(ord);
                                // console.log(res);
                            }
                        }
                    })
                }
            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}

function submitEthToTokenOrder(cmcName, srcAmt, dstAmt){
    if ((web3.fromWei(srcAmt, 'ether') * tokenToUsd("ETH")) > 1000){
        var coinDetails = getTokenDetails(cmcName);
        if (coinDetails) {
            if(coinDetails.pml){
                var ReserveContract = "";
                var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
                $.getJSON(etherscanUrl, function(result) {
                    ReserveContract = web3.eth.contract(JSON.parse(result.result));
                    var Reserve = ReserveContract.at(coinDetails.reserveAddress);

                    Reserve.submitEthToTokenOrder(srcAmt, dstAmt, (err, res) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(res);
                            EthToTokenOrderListLength = res.length;
                            var ind = 0;
                            for (ind = 0; ind <= EthToTokenOrderListLength; ind++){
                                EthToTokenOrderIndicies.push(res[ind].c[0]);
                            }
                        }
                    })

                });
            }
            else {
                console.log("Not PML");
            }
        } else {
            console.log("Invalid Coin.")
        }   
    }
    else{
        console.log("Source Amount is too Less");
    }
}

function updateEthToTokenOrder(id, cmcName, srcAmt, dstAmt){
    if ((web3.fromWei(srcAmt, 'ether') * tokenToUsd("ETH")) > 1000){
        var coinDetails = getTokenDetails(cmcName);
        if (coinDetails) {
            if(coinDetails.pml){
                var ReserveContract = "";
                var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
                $.getJSON(etherscanUrl, function(result) {
                    ReserveContract = web3.eth.contract(JSON.parse(result.result));
                    var Reserve = ReserveContract.at(coinDetails.reserveAddress);

                    Reserve.updateEthToTokenOrder(id, srcAmt, dstAmt, (err, res) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(res);
                        }
                    })

                });
            }
            else {
                console.log("Not PML");
            }
        } else {
            console.log("Invalid Coin.")
        }   
    }
    else{
        console.log("Source Amount is too Less");
    }
}

function cancelEthToTokenOrder(cmcName, id){
    var coinDetails = getTokenDetails(cmcName);
    if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);
                Reserve.cancelEthToTokenOrder(id, (err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                    }
                })

            });
        }
        else {
            console.log("Not PML");
        }
    } else {
        console.log("Invalid Coin.")
    }  
}

function getEthToTokenOrderList(cmcName){
    var coinDetails = getTokenDetails(cmcName);
    if (coinDetails) {
        if(coinDetails.pml){
            var ReserveContract = "";
            var etherscanUrl = "https://api-ropsten.etherscan.io/api?module=contract&action=getabi&address=" + coinDetails.reserveAddress;
            $.getJSON(etherscanUrl, function(result) {
                ReserveContract = web3.eth.contract(JSON.parse(result.result));
                var Reserve = ReserveContract.at(coinDetails.reserveAddress);

                Reserve.getEthToTokenOrderList((err, res) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(res);
                        EthToTokenOrderListLength = res.length;
                        var ind = 0;
                        for (ind = 0; ind <= EthToTokenOrderListLength; ind++){
                            EthToTokenOrderIndicies.push(res[ind].c[0]);
                        }
                    }
                })

            });
        }
        else {
            console.log("Not PML");
        }
	} else {
		console.log("Invalid Coin.")
	}
}


function tokenToUsd(cmcName, cur = "USD"){
    var apiUrl = "https://min-api.cryptocompare.com/data/price?fsym=" + cmcName + "&tsyms=" + cur;
    $.getJSON(apiUrl, function(result) {
        // console.log(result[cur]);
        tokenToUsdResult = result[cur];
    });
}
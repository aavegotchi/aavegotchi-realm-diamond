# GBM_Library_Aavegotchi
Working repo for the GBM auction contract    

The GBM auction is the intellectual property of Perpetual Altruism Ltd. This code is provided for transparency and licensing purposes. To get a license, please get in touch with us at http://gbm.auction


## Setup and deployments     
Use your favorite deploying tools. Easiest way for tinkering is using https://remix.ethereum.org + remixd     
Those contract can be used "as is" for live projects, but be aware they are not upgradable and can only auction a specific NFT once.   
    
### Setup the token contracts   
- Deploy the ERC-20 token contract that is gonna be used as currency and either ERC-721 or ERC-1155 token contracts to be used as NFTs to auction.

For testing purposes, an implementation of each of those contract can be found in *src/contracts/token/ERCxxxGeneric.sol*

### Setup the GBM contract

- Deploy the *src/contracts/GBM/GBM.sol* GBM contract with the following parameter :

    `_ERC20Currency = The address of the ERC20 smart contract to be used as currency`

### Mint and transfer a token
- Mint an ERC-721 or ERC-1155 token
- Transfer it to the GBM smart contract address.

### Setup auction parameters
- Deploy the *src/contracts/GBM/GBMInitiator.sol* GBMInitiator contract         
- Use the setters of GBMInitiator with the following suggested parameters     
 
    `  setBidDecimals(100000);`               
    `  setBidMultiplier(11120);`          
    `  setEndTime("in 25mn"); //Use https://www.unixtimestamp.com if needed `         
    `  setHammerTimeDuration(300); // 5mn of additional time at the end of an auction if new incoming bid`            
    `  setIncMax(10000);`            
    `  setIncMin(1000);`             
    `  setStartTime("in 15mn");`           
    `  setStepMin(10000);`        

### Register default auction parameters for a Token Smart Contract         
- On the GBM smart contract, call *registerAnAuctionContract()* with :       
    `  _contract = the address of the smart ERC721 or ERC1155 tokens smart contract`             
    `  _initiator = the address of the initiator you previously deployed`       

### Register an auction for a token that the GBM contract hold         
- On the GBM smart contract, call *registerAnAuctionToken()* with :     
    `  _contract = the address of the smart ERC721 or ERC1155 tokens smart contract     `     
    `  _tokenId = the token ID of the token held by the GBM smart contract    `    
    `  _initiator = the initiator you previously deployed`           
    `  _tokenKind = 0x73ad2146 if the token is ERC721, 0x973bb640 if the token is ERC1155`          
    `  _initiator = the address of the initiator you previously deployed, 0x0 if wanting to use default values for the contract`  

### Modify an auction already registered for a token that the GBM contract hold         
- On the GBM smart contract, call *modifyAnAuctionToken()* with :     
    `  _contract = the address of the smart ERC721 or ERC1155 tokens smart contract     `     
    `  _tokenId = the token ID of the token held by the GBM smart contract    `    
    `  _initiator = the initiator you previously deployed`           
    `  _tokenKind = 0x73ad2146 if the token is ERC721, 0x973bb640 if the token is ERC1155`          
    `  _initiator = the address of the initiator you previously deployed. Have the initater values set to 0 if wanting to rest the auction to default contract values`  
    `  _1155Index = the numerotation of an ERC1155 token within a single token ID. use getAuctionID(address _contract, uint256 _tokenID, uint256 _tokenIndex) to match it` 
    `  _rewrite = true if modifiying an existing auction, false if registering a new one`

### Allowing bidding for tokens
- On the GBM smart contract, call *setBiddingAllowed(token smart contract address, true)* for allowing bidding and claiming on ALL auctions associated with a smart contract token address.    
- On the GBM smart contract, call *setBiddingAllowed(token smart contract address, false)* for preventing bidding and claiming on ALL auctions associated with a smart contract token address.   

By default bidding/claiming is prevented.

## Bidding and Claiming

### Acquire currency and Authorize GBM
- With the wallet you want to place a bid with in order to win an NFT, acquire/mint some of the ERC-20 currency
- ERC20 Approve() the GBM smart contract as a spender with the amount you are willing to spend your bid. Recommended high value of "approve" as each subsequent bid will require full spending again after being refunded by the GBM smart contract.

### Bid
- On the GBM smart contract, call *Bid()* from the wallet you want to place a bid with            
 `  _auctionID = the _auctionID of the token you want to bid on. Use events or getAuctionID() to find it`    
 `  _bidAmount = the amount of your bid in the ERC20 currency. If the GBM contract cannot withdraw from you, the transaction will fail`    
 ` _highestBid = the current highest bid. If a new highest bid has been placed before you can place yours, the transaction will fail.`    
       
       
- When you are outbid, you will instantly receive your bid refund as well as your incentives.  
- You cannot bid before or after the auction start/end.    
- If bidding less than HammerTimeDuration seconds before the end of the auction, the auction will move it's end to be in HammerTimeDuration seconds.    

### Claim
Once an auction as ended, anyone (including the winner) can call *claim(auctionID)* to attribute the tokens to the highest bidder at the end of the auction and distribute the proceeds of the auction to the GBM contract owner.
    

# GBM_Diamond_Aavegotchi

Working repo for the GBM auction contract

The GBM auction is the intellectual property of Perpetual Altruism Ltd. This code is provided for transparency and licensing purposes. To get a license, please get in touch with us at http://gbm.auction

## Latest Kovan deployment

GBM: 0xC025B341fF094958179d6acdddBD86042430DE1d
Initiator: 0x3EF3b22917D663ECE1896F98251fa44d96052e07

### Setup the token contracts

- Deploy the ERC-20 token contract that is gonna be used as currency and either ERC-721 or ERC-1155 token contracts to be used as NFTs to auction.
- For Aavegotchi, GHST is used instead of deploying new ERC-20.

For testing purposes, an implementation of each of those contract can be found in _src/contracts/test/ERCxxxGeneric.sol_

### Setup the GBM Diamond and Facets

- GBM Diamond and facets could be deployed with following deploy script.

  _src/scripts/deploy.js_

- Before deploy, you need to check and configure default aution parameters for GBM in deploy script.

  ```
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const _pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const _playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
  const _daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

  let startTime = Math.floor(Date.now() / 1000);
  let endTime = Math.floor(Date.now() / 1000) + 86400;
  let hammerTimeDuration = 300;
  let bidDecimals = 100000;
  let stepMin = 10000;
  let incMax = 10000;
  let incMin = 1000;
  let bidMultiplier = 11120;
  ```

### Mint and transfer a token

- Mint an ERC-721 or ERC-1155 token
- Transfer it to the GBM diamond address.

### Register default auction parameters for a Token Smart Contract

- On the GBM smart contract, call _registerAnAuctionContract()_ with :  
   ` _contract = the address of the smart ERC721 or ERC1155 tokens smart contract`

### Register an auction for a token that the GBM contract hold

- On the GBM smart contract, call _registerAnAuctionToken()_ with :  
   `_contract = the address of the smart ERC721 or ERC1155 tokens smart contract`  
   `_tokenId = the token ID of the token held by the GBM smart contract`  
   ` _tokenKind = 0x73ad2146 if the token is ERC721, 0x973bb640 if the token is ERC1155`

### Modify an auction already registered for a token that the GBM contract hold

- On the GBM smart contract, call _modifyAnAuctionToken()_ with :  
   `_contract = the address of the smart ERC721 or ERC1155 tokens smart contract`  
   `_tokenId = the token ID of the token held by the GBM smart contract`  
   ` _tokenKind = 0x73ad2146 if the token is ERC721, 0x973bb640 if the token is ERC1155`  
   ` _useInitiator_ = the address of the initiator you previously deployed. Have the initater values set to 0 if wanting to rest the auction to default contract values`  
   `_1155Index = Set to`false`if you want to use the default value registered for the token contract (if wanting to reset to default,use`true`)`
  ` _rewrite = true if modifiying an existing auction, false if registering a new one`

### Allowing bidding for tokens

- On the GBM smart contract, call _setBiddingAllowed(token smart contract address, true)_ for allowing bidding and claiming on ALL auctions associated with a smart contract token address.
- On the GBM smart contract, call _setBiddingAllowed(token smart contract address, false)_ for preventing bidding and claiming on ALL auctions associated with a smart contract token address.

By default bidding/claiming is prevented.

## Bidding and Claiming

### Acquire currency and Authorize GBM

- With the wallet you want to place a bid with in order to win an NFT, acquire/mint some of the ERC-20 currency
- ERC20 Approve() the GBM smart contract as a spender with the amount you are willing to spend your bid. Recommended high value of "approve" as each subsequent bid will require full spending again after being refunded by the GBM smart contract.

### Bid

- On the GBM smart contract, call _Bid()_ from the wallet you want to place a bid with  
  ` _auctionID = the _auctionID of the token you want to bid on. Use events or getAuctionID() to find it`  
  ` _bidAmount = the amount of your bid in the ERC20 currency. If the GBM contract cannot withdraw from you, the transaction will fail`  
  ` _highestBid = the current highest bid. If a new highest bid has been placed before you can place yours, the transaction will fail.`
- When you are outbid, you will instantly receive your bid refund as well as your incentives.
- You cannot bid before or after the auction start/end.
- If bidding less than HammerTimeDuration seconds before the end of the auction, the auction will move it's end to be in HammerTimeDuration seconds.

### Claim

Once an auction as ended, anyone (including the winner) can call _claim(auctionID)_ to attribute the tokens to the highest bidder at the end of the auction and distribute the proceeds of the auction to the GBM contract owner.

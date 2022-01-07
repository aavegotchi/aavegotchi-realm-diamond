# IGBM

*Guillaume Gonnaud*

> IGBM GBM auction interface



*See GBM.auction on how to use this contract*

## Methods

### batchClaim

```solidity
function batchClaim(uint256[] _auctionIds) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionIds | uint256[] | undefined

### claim

```solidity
function claim(uint256 _auctionId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

### erc20Currency

```solidity
function erc20Currency() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### getAuctionBidDecimals

```solidity
function getAuctionBidDecimals(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionBidMultiplier

```solidity
function getAuctionBidMultiplier(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionDebt

```solidity
function getAuctionDebt(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionDueIncentives

```solidity
function getAuctionDueIncentives(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionEndTime

```solidity
function getAuctionEndTime(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionHammerTimeDuration

```solidity
function getAuctionHammerTimeDuration(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionHighestBid

```solidity
function getAuctionHighestBid(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionHighestBidder

```solidity
function getAuctionHighestBidder(uint256 _auctionId) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### getAuctionID

```solidity
function getAuctionID(address _contract, uint256 _tokenID, uint256 _tokenIndex) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract | address | undefined
| _tokenID | uint256 | undefined
| _tokenIndex | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionIncMax

```solidity
function getAuctionIncMax(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionIncMin

```solidity
function getAuctionIncMin(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionStartTime

```solidity
function getAuctionStartTime(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getAuctionStepMin

```solidity
function getAuctionStepMin(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getContractAddress

```solidity
function getContractAddress(uint256 _auctionId) external view returns (address)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### getTokenId

```solidity
function getTokenId(uint256 _auctionId) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### getTokenKind

```solidity
function getTokenKind(uint256 _auctionId) external view returns (bytes4)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4 | undefined



## Events

### Auction_BidPlaced

```solidity
event Auction_BidPlaced(uint256 indexed _auctionID, address indexed _bidder, uint256 _bidAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _bidder `indexed` | address | undefined |
| _bidAmount  | uint256 | undefined |

### Auction_BidRemoved

```solidity
event Auction_BidRemoved(uint256 indexed _auctionID, address indexed _bidder, uint256 _bidAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _bidder `indexed` | address | undefined |
| _bidAmount  | uint256 | undefined |

### Auction_EndTimeUpdated

```solidity
event Auction_EndTimeUpdated(uint256 indexed _auctionID, uint256 _endTime)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _endTime  | uint256 | undefined |

### Auction_IncentivePaid

```solidity
event Auction_IncentivePaid(uint256 indexed _auctionID, address indexed _earner, uint256 _incentiveAmount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _earner `indexed` | address | undefined |
| _incentiveAmount  | uint256 | undefined |

### Auction_Initialized

```solidity
event Auction_Initialized(uint256 indexed _auctionID, uint256 indexed _tokenID, uint256 indexed _tokenIndex, address _contractAddress, bytes4 _tokenKind)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _tokenID `indexed` | uint256 | undefined |
| _tokenIndex `indexed` | uint256 | undefined |
| _contractAddress  | address | undefined |
| _tokenKind  | bytes4 | undefined |

### Auction_ItemClaimed

```solidity
event Auction_ItemClaimed(uint256 indexed _auctionID)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |

### Auction_StartTimeUpdated

```solidity
event Auction_StartTimeUpdated(uint256 indexed _auctionID, uint256 _startTime)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _auctionID `indexed` | uint256 | undefined |
| _startTime  | uint256 | undefined |

### Contract_BiddingAllowed

```solidity
event Contract_BiddingAllowed(address indexed _contract, bool _biddingAllowed)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _contract `indexed` | address | undefined |
| _biddingAllowed  | bool | undefined |




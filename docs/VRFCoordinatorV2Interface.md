# VRFCoordinatorV2Interface









## Methods

### acceptSubscriptionOwnerTransfer

```solidity
function acceptSubscriptionOwnerTransfer(uint64 subId) external nonpayable
```

Request subscription owner transfer.

*will revert if original owner of subId has not requested that msg.sender become the new owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription

### addConsumer

```solidity
function addConsumer(uint64 subId, address consumer) external nonpayable
```

Add a consumer to a VRF subscription.



#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription
| consumer | address | - New consumer which can use the subscription

### cancelSubscription

```solidity
function cancelSubscription(uint64 subId, address to) external nonpayable
```

Cancel a subscription



#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription
| to | address | - Where to send the remaining LINK to

### createSubscription

```solidity
function createSubscription() external nonpayable returns (uint64 subId)
```

Create a VRF subscription.

*You can manage the consumer set dynamically with addConsumer/removeConsumer.Note to fund the subscription, use transferAndCall. For exampleLINKTOKEN.transferAndCall(address(COORDINATOR),amount,abi.encode(subId));*


#### Returns

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - A unique subscription id.

### getRequestConfig

```solidity
function getRequestConfig() external view returns (uint16, uint32, bytes32[])
```

Get configuration relevant for making requests




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint16 | minimumRequestConfirmations global min for request confirmations
| _1 | uint32 | maxGasLimit global max for request gas limit
| _2 | bytes32[] | s_provingKeyHashes list of registered key hashes

### getSubscription

```solidity
function getSubscription(uint64 subId) external view returns (uint96 balance, uint64 reqCount, address owner, address[] consumers)
```

Get a VRF subscription.



#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription

#### Returns

| Name | Type | Description |
|---|---|---|
| balance | uint96 | - LINK balance of the subscription in juels.
| reqCount | uint64 | - number of requests for this subscription, determines fee tier.
| owner | address | - owner of the subscription.
| consumers | address[] | - list of consumer address which are able to use this subscription.

### removeConsumer

```solidity
function removeConsumer(uint64 subId, address consumer) external nonpayable
```

Remove a consumer from a VRF subscription.



#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription
| consumer | address | - Consumer to remove from the subscription

### requestRandomWords

```solidity
function requestRandomWords(bytes32 keyHash, uint64 subId, uint16 minimumRequestConfirmations, uint32 callbackGasLimit, uint32 numWords) external nonpayable returns (uint256 requestId)
```

Request a set of random words.



#### Parameters

| Name | Type | Description |
|---|---|---|
| keyHash | bytes32 | - Corresponds to a particular oracle job which uses that key for generating the VRF proof. Different keyHash&#39;s have different gas price ceilings, so you can select a specific one to bound your maximum per request cost.
| subId | uint64 | - The ID of the VRF subscription. Must be funded with the minimum subscription balance required for the selected keyHash.
| minimumRequestConfirmations | uint16 | - How many blocks you&#39;d like the oracle to wait before responding to the request. See SECURITY CONSIDERATIONS for why you may want to request more. The acceptable range is [minimumRequestBlockConfirmations, 200].
| callbackGasLimit | uint32 | - How much gas you&#39;d like to receive in your fulfillRandomWords callback. Note that gasleft() inside fulfillRandomWords may be slightly less than this amount because of gas used calling the function (argument decoding etc.), so you may need to request slightly more than you expect to have inside fulfillRandomWords. The acceptable range is [0, maxGasLimit]
| numWords | uint32 | - The number of uint256 random values you&#39;d like to receive in your fulfillRandomWords callback. Note these numbers are expanded in a secure way by the VRFCoordinator from a single random value supplied by the oracle.

#### Returns

| Name | Type | Description |
|---|---|---|
| requestId | uint256 | - A unique identifier of the request. Can be used to match a request to a response in fulfillRandomWords.

### requestSubscriptionOwnerTransfer

```solidity
function requestSubscriptionOwnerTransfer(uint64 subId, address newOwner) external nonpayable
```

Request subscription owner transfer.



#### Parameters

| Name | Type | Description |
|---|---|---|
| subId | uint64 | - ID of the subscription
| newOwner | address | - proposed new owner of the subscription





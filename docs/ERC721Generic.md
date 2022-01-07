# ERC721Generic

*Guillaume Gonnaud 2021*

> ERC721 Generic placeholder smart contract for testing and ABI





## Methods

### approve

```solidity
function approve(address _approved, uint256 _tokenId) external payable
```

Change or reaffirm the approved address for an NFT

*The zero address indicates there is no approved address.  Throws unless `msg.sender` is the current NFT owner, or an authorized  operator of the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _approved | address | The new approved NFT controller
| _tokenId | uint256 | The NFT to approve

### balanceOf

```solidity
function balanceOf(address) external view returns (uint256)
```

Count all NFTs assigned to an owner

*NFTs assigned to the zero address are considered invalid, and this  function throws for queries about the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The number of NFTs owned by `_owner`, possibly zero

### getApproved

```solidity
function getApproved(uint256 _tokenId) external view returns (address)
```

Get the approved address for a single NFT

*Throws if `_tokenId` is not a valid NFT.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenId | uint256 | The NFT to find the approved address for

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | The approved address for this NFT, or the zero address if there is none

### getTotalSupply

```solidity
function getTotalSupply() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### isApprovedForAll

```solidity
function isApprovedForAll(address _owner, address _operator) external view returns (bool)
```

Query if an address is an authorized operator for another address



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | The address that owns the NFTs
| _operator | address | The address that acts on behalf of the owner

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | True if `_operator` is an approved operator for `_owner`, false otherwise

### mint

```solidity
function mint(uint256 _amount) external nonpayable returns (uint256)
```

Mint tokens for msg.sender, with token ID  from totalSupply+1 to totalSupply+amount



#### Parameters

| Name | Type | Description |
|---|---|---|
| _amount | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### name

```solidity
function name() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

### owner

```solidity
function owner() external view returns (address)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined

### ownerOf

```solidity
function ownerOf(uint256 _tokenId) external view returns (address)
```

Find the owner of an NFT

*NFTs assigned to zero address are considered invalid, and queries about them do throw.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenId | uint256 | The identifier for an NFT

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | The address of the owner of the NFT

### safeTransferFrom

```solidity
function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes data) external payable
```

Transfers the ownership of an NFT from one address to another address

*Throws unless `msg.sender` is the current owner, an authorized  operator, or the approved address for this NFT. Throws if `_from` is  not the current owner. Throws if `_to` is the zero address. Throws if  `_tokenId` is not a valid NFT. When transfer is complete, this function  checks if `_to` is a smart contract (code size &gt; 0). If so, it calls  `onERC721Received` on `_to` and throws if the return value is not  `bytes4(keccak256(&quot;onERC721Received(address,address,uint256,bytes)&quot;))`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | The current owner of the NFT
| _to | address | The new owner
| _tokenId | uint256 | The NFT to transfer
| data | bytes | Additional data with no specified format, sent in call to `_to`

### setApprovalForAll

```solidity
function setApprovalForAll(address _operator, bool _approved) external nonpayable
```

Enable or disable approval for a third party (&quot;operator&quot;) to manage  all of `msg.sender`&#39;s assets

*Emits the ApprovalForAll event. The contract MUST allow  multiple operators per owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _operator | address | Address to add to the set of authorized operators
| _approved | bool | True if the operator is approved, false to revoke approval

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceID) external pure returns (bool)
```

Query if a contract implements an interface

*Interface identification is specified in ERC-165. This function  uses less than 30,000 gas.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| interfaceID | bytes4 | The interface identifier, as specified in ERC-165

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | `true` if the contract implements `interfaceID` and  `interfaceID` is not 0xffffffff, `false` otherwise

### symbol

```solidity
function symbol() external view returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

### totalSupply

```solidity
function totalSupply() external view returns (uint256)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### transferFrom

```solidity
function transferFrom(address _from, address _to, uint256 _tokenId) external payable
```

Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE  THEY MAY BE PERMANENTLY LOST

*Throws unless `msg.sender` is the current owner, an authorized  operator, or the approved address for this NFT. Throws if `_from` is  not the current owner. Throws if `_to` is the zero address. Throws if  `_tokenId` is not a valid NFT.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | The current owner of the NFT
| _to | address | The new owner
| _tokenId | uint256 | The NFT to transfer



## Events

### Approval

```solidity
event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _approved `indexed` | address | undefined |
| _tokenId `indexed` | uint256 | undefined |

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _operator `indexed` | address | undefined |
| _approved  | bool | undefined |

### Transfer

```solidity
event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _from `indexed` | address | undefined |
| _to `indexed` | address | undefined |
| _tokenId `indexed` | uint256 | undefined |




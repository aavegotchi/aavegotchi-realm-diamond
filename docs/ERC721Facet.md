# ERC721Facet









## Methods

### approve

```solidity
function approve(address _approved, uint256 _tokenId) external nonpayable
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
function balanceOf(address _owner) external view returns (uint256 balance_)
```

Count all NFTs assigned to an owner

*NFTs assigned to the zero address are considered invalid, and this.  function throws for queries about the zero address.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | An address for whom to query the balance

#### Returns

| Name | Type | Description |
|---|---|---|
| balance_ | uint256 | The number of NFTs owned by `_owner`, possibly zero

### getApproved

```solidity
function getApproved(uint256 _tokenId) external view returns (address approved_)
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
| approved_ | address | The approved address for this NFT, or the zero address if there is none

### isApprovedForAll

```solidity
function isApprovedForAll(address _owner, address _operator) external view returns (bool approved_)
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
| approved_ | bool | True if `_operator` is an approved operator for `_owner`, false otherwise

### name

```solidity
function name() external pure returns (string)
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

### ownerOf

```solidity
function ownerOf(uint256 _tokenId) external view returns (address owner_)
```

Find the owner of an NFT

*NFTs assigned to zero address are considered invalid, and queries  about them do throw.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenId | uint256 | The identifier for an NFT

#### Returns

| Name | Type | Description |
|---|---|---|
| owner_ | address | The address of the owner of the NFT

### safeBatchTransfer

```solidity
function safeBatchTransfer(address _from, address _to, uint256[] _tokenIds, bytes _data) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | undefined
| _to | address | undefined
| _tokenIds | uint256[] | undefined
| _data | bytes | undefined

### safeTransferFrom

```solidity
function safeTransferFrom(address _from, address _to, uint256 _tokenId, bytes _data) external nonpayable
```

Transfers the ownership of an NFT from one address to another address

*Throws unless `msg.sender` is the current owner, an authorized  operator, or the approved address for this NFT. Throws if `_from` is  not the current owner. Throws if `_to` is the zero address. Throws if  `_tokenId` is not a valid NFT. When transfer is complete, this function  checks if `_to` is a smart contract (code size &gt; 0). If so, it calls  `onERC721Received` on `_to` and throws if the return value is not  `bytes4(keccak256(&quot;onERC721Received(address,address,uint256,bytes)&quot;))`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | The current owner of the NFT
| _to | address | The new owner
| _tokenId | uint256 | The NFT to transfer
| _data | bytes | Additional data with no specified format, sent in call to `_to`

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

### symbol

```solidity
function symbol() external pure returns (string)
```

An abbreviated name for NFTs in this contract




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | string | undefined

### tokenByIndex

```solidity
function tokenByIndex(uint256 _index) external view returns (uint256 tokenId_)
```

Enumerate valid NFTs

*Throws if `_index` &gt;= `totalSupply()`.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _index | uint256 | A counter less than `totalSupply()`

#### Returns

| Name | Type | Description |
|---|---|---|
| tokenId_ | uint256 | The token identifier for the `_index`th NFT,  (sort order not specified)

### tokenIdsOfOwner

```solidity
function tokenIdsOfOwner(address _owner) external view returns (uint256[] tokenIds_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| tokenIds_ | uint256[] | undefined

### tokenURI

```solidity
function tokenURI(uint256 _tokenId) external pure returns (string)
```

A distinct Uniform Resource Identifier (URI) for a given asset.

*Throws if `_tokenId` is not a valid NFT. URIs are defined in RFC  3986. The URI may point to a JSON file that conforms to the &quot;ERC721  Metadata JSON Schema&quot;.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenId | uint256 | undefined

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
function transferFrom(address _from, address _to, uint256 _tokenId) external nonpayable
```

Transfer ownership of an NFT -- THE CALLER IS RESPONSIBLE  TO CONFIRM THAT `_to` IS CAPABLE OF RECEIVING NFTS OR ELSE  THEY MAY BE PERMANENTLY LOST

*Throws unless `msg.sender` is the current owner, an authorized  operator, or the approved address for this NFT. Throws if `_from` is  not the current owner. Throws if `_to` is the zero address. Throws if  `_tokenId` is not a valid NFT.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | The current owner of the NFT
| _to | address | The new owner
| _tokenId | uint256 | The NFT to transfer





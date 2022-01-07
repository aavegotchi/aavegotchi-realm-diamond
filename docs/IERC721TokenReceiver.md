# IERC721TokenReceiver



> IERC721TokenReceiver



*See https://eips.ethereum.org/EIPS/eip-721. Note: the ERC-165 identifier for this interface is 0x150b7a02.*

## Methods

### onERC721Received

```solidity
function onERC721Received(address _operator, address _from, uint256 _tokenId, bytes _data) external nonpayable returns (bytes4)
```

Handle the receipt of an NFT

*The ERC721 smart contract calls this function on the recipient  after a `transfer`. This function MAY throw to revert and reject the  transfer. Return of other than the magic value MUST result in the  transaction being reverted.  Note: the contract address is always the message sender.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _operator | address | The address which called `safeTransferFrom` function
| _from | address | The address which previously owned the token
| _tokenId | uint256 | The NFT identifier which is being transferred
| _data | bytes | Additional data with no specified format

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bytes4 | `bytes4(keccak256(&quot;onERC721Received(address,address,uint256,bytes)&quot;))`  unless throwing





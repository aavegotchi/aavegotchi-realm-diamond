# ERC1155Facet









## Methods

### balanceOf

```solidity
function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_)
```

Get the balance of an account&#39;s tokens.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | The address of the token holder
| _id | uint256 | ID of the token

#### Returns

| Name | Type | Description |
|---|---|---|
| bal_ | uint256 |    The _owner&#39;s balance of the token type requested

### balanceOfBatch

```solidity
function balanceOfBatch(address[] _owners, uint256[] _ids) external view returns (uint256[] bals)
```

Get the balance of multiple account/token pairs



#### Parameters

| Name | Type | Description |
|---|---|---|
| _owners | address[] | The addresses of the token holders
| _ids | uint256[] | ID of the tokens

#### Returns

| Name | Type | Description |
|---|---|---|
| bals | uint256[] |   The _owner&#39;s balance of the token types requested (i.e. balance for each (owner, id) pair)

### isApprovedForAll

```solidity
function isApprovedForAll(address account, address operator) external view returns (bool operators_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| account | address | undefined
| operator | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| operators_ | bool | undefined

### safeBatchTransferFrom

```solidity
function safeBatchTransferFrom(address _from, address _to, uint256[] _ids, uint256[] _values, bytes _data) external nonpayable
```

Transfers `_values` amount(s) of `_ids` from the `_from` address to the `_to` address specified (with safety call).

*Caller must be approved to manage the tokens being transferred out of the `_from` account (see &quot;Approval&quot; section of the standard). MUST revert if `_to` is the zero address. MUST revert if length of `_ids` is not the same as length of `_values`. MUST revert if any of the balance(s) of the holder(s) for token(s) in `_ids` is lower than the respective amount(s) in `_values` sent to the recipient. MUST revert on any other error.         MUST emit `TransferSingle` or `TransferBatch` event(s) such that all the balance changes are reflected (see &quot;Safe Transfer Rules&quot; section of the standard). Balance changes and events MUST follow the ordering of the arrays (_ids[0]/_values[0] before _ids[1]/_values[1], etc). After the above conditions for the transfer(s) in the batch are met, this function MUST check if `_to` is a smart contract (e.g. code size &gt; 0). If so, it MUST call the relevant `ERC1155TokenReceiver` hook(s) on `_to` and act appropriately (see &quot;Safe Transfer Rules&quot; section of the standard).                      *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | Source address
| _to | address | Target address
| _ids | uint256[] | IDs of each token type (order and length must match _values array)
| _values | uint256[] | Transfer amounts per token type (order and length must match _ids array)
| _data | bytes | Additional data with no specified format, MUST be sent unaltered in call to the `ERC1155TokenReceiver` hook(s) on `_to`

### safeTransferFrom

```solidity
function safeTransferFrom(address _from, address _to, uint256 _id, uint256 _value, bytes _data) external nonpayable
```

Transfers `_value` amount of an `_id` from the `_from` address to the `_to` address specified (with safety call).

*Caller must be approved to manage the tokens being transferred out of the `_from` account (see &quot;Approval&quot; section of the standard). MUST revert if `_to` is the zero address. MUST revert if balance of holder for token `_id` is lower than the `_value` sent. MUST revert on any other error. MUST emit the `TransferSingle` event to reflect the balance change (see &quot;Safe Transfer Rules&quot; section of the standard). After the above conditions are met, this function MUST check if `_to` is a smart contract (e.g. code size &gt; 0). If so, it MUST call `onERC1155Received` on `_to` and act appropriately (see &quot;Safe Transfer Rules&quot; section of the standard).        *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from | address | Source address
| _to | address | Target address
| _id | uint256 | ID of the token type
| _value | uint256 | Transfer amount
| _data | bytes | Additional data with no specified format, MUST be sent unaltered in call to `onERC1155Received` on `_to`

### setApprovalForAll

```solidity
function setApprovalForAll(address owner, address operator, bool approved) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| owner | address | undefined
| operator | address | undefined
| approved | bool | undefined

### setBaseURI

```solidity
function setBaseURI(string _value) external nonpayable
```

Set the base url for all voucher types



#### Parameters

| Name | Type | Description |
|---|---|---|
| _value | string | The new base url        





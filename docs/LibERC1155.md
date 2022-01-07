# LibERC1155










## Events

### ApprovalForAll

```solidity
event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved)
```



*MUST emit when approval for a second party/operator address to manage all tokens for an owner address is enabled or disabled (absence of an event assumes disabled).        *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _operator `indexed` | address | undefined |
| _approved  | bool | undefined |

### MintInstallation

```solidity
event MintInstallation(address indexed _owner, uint256 indexed _installationType, uint256 _installationId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _installationType `indexed` | uint256 | undefined |
| _installationId  | uint256 | undefined |

### TransferBatch

```solidity
event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, uint256[] _ids, uint256[] _values)
```



*Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see &quot;Safe Transfer Rules&quot; section of the standard).       The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()). The `_from` argument MUST be the address of the holder whose balance is decreased. The `_to` argument MUST be the address of the recipient whose balance is increased. The `_ids` argument MUST be the list of tokens being transferred. The `_values` argument MUST be the list of number of tokens (matching the list and order of tokens specified in _ids) the holder balance is decreased by and match what the recipient balance is increased by. When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address). When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).                *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _operator `indexed` | address | undefined |
| _from `indexed` | address | undefined |
| _to `indexed` | address | undefined |
| _ids  | uint256[] | undefined |
| _values  | uint256[] | undefined |

### TransferFromParent

```solidity
event TransferFromParent(address indexed _fromContract, uint256 indexed _fromTokenId, uint256 indexed _tokenTypeId, uint256 _value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _fromContract `indexed` | address | undefined |
| _fromTokenId `indexed` | uint256 | undefined |
| _tokenTypeId `indexed` | uint256 | undefined |
| _value  | uint256 | undefined |

### TransferSingle

```solidity
event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, uint256 _id, uint256 _value)
```



*Either `TransferSingle` or `TransferBatch` MUST emit when tokens are transferred, including zero value transfers as well as minting or burning (see &quot;Safe Transfer Rules&quot; section of the standard). The `_operator` argument MUST be the address of an account/contract that is approved to make the transfer (SHOULD be LibMeta.msgSender()). The `_from` argument MUST be the address of the holder whose balance is decreased. The `_to` argument MUST be the address of the recipient whose balance is increased. The `_id` argument MUST be the token type being transferred. The `_value` argument MUST be the number of tokens the holder balance is decreased by and match what the recipient balance is increased by. When minting/creating tokens, the `_from` argument MUST be set to `0x0` (i.e. zero address). When burning/destroying tokens, the `_to` argument MUST be set to `0x0` (i.e. zero address).        *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _operator `indexed` | address | undefined |
| _from `indexed` | address | undefined |
| _to `indexed` | address | undefined |
| _id  | uint256 | undefined |
| _value  | uint256 | undefined |

### TransferToParent

```solidity
event TransferToParent(address indexed _toContract, uint256 indexed _toTokenId, uint256 indexed _tokenTypeId, uint256 _value)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _toContract `indexed` | address | undefined |
| _toTokenId `indexed` | uint256 | undefined |
| _tokenTypeId `indexed` | uint256 | undefined |
| _value  | uint256 | undefined |

### URI

```solidity
event URI(string _value, uint256 indexed _tokenId)
```



*MUST emit when the URI is updated for a token ID. URIs are defined in RFC 3986. The URI MUST point to a JSON file that conforms to the &quot;ERC-1155 Metadata URI JSON Schema&quot;.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _value  | string | undefined |
| _tokenId `indexed` | uint256 | undefined |




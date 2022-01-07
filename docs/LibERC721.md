# LibERC721










## Events

### Approval

```solidity
event Approval(address indexed _owner, address indexed _approved, uint256 indexed _tokenId)
```



*This emits when the approved address for an NFT is changed or  reaffirmed. The zero address indicates there is no approved address.  When a Transfer event emits, this also indicates that the approved  address for that NFT (if any) is reset to none.*

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



*This emits when an operator is enabled or disabled for an owner.  The operator can manage all NFTs of the owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _operator `indexed` | address | undefined |
| _approved  | bool | undefined |

### MintParcel

```solidity
event MintParcel(address indexed _owner, uint256 indexed _tokenId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner `indexed` | address | undefined |
| _tokenId `indexed` | uint256 | undefined |

### Transfer

```solidity
event Transfer(address indexed _from, address indexed _to, uint256 indexed _tokenId)
```



*This emits when ownership of any NFT changes by any mechanism.  This event emits when NFTs are created (`from` == 0) and destroyed  (`to` == 0). Exception: during contract creation, any number of NFTs  may be created and assigned without emitting Transfer. At the time of  any transfer, the approved address for that NFT (if any) is reset to none.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _from `indexed` | address | undefined |
| _to `indexed` | address | undefined |
| _tokenId `indexed` | uint256 | undefined |




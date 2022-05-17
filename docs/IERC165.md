# IERC165



> IERC165



*https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md*

## Methods

### supportsInterface

```solidity
function supportsInterface(bytes4 interfaceID) external view returns (bool)
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





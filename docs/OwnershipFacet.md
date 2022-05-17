# OwnershipFacet









## Methods

### owner

```solidity
function owner() external view returns (address owner_)
```

Get the address of the owner




#### Returns

| Name | Type | Description |
|---|---|---|
| owner_ | address | The address of the owner.

### transferOwnership

```solidity
function transferOwnership(address _newOwner) external nonpayable
```

Set the address of the new owner of the contract

*Set _newOwner to address(0) to renounce any ownership.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _newOwner | address | The address of the new owner of the contract



## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |




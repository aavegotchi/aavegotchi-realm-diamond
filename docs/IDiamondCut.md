# IDiamondCut









## Methods

### diamondCut

```solidity
function diamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata) external nonpayable
```

Add/replace/remove any number of functions and optionally execute         a function with delegatecall



#### Parameters

| Name | Type | Description |
|---|---|---|
| _diamondCut | IDiamondCut.FacetCut[] | Contains the facet addresses and function selectors
| _init | address | The address of the contract or facet to execute _calldata
| _calldata | bytes | A function call, including function selector and arguments                  _calldata is executed with delegatecall on _init



## Events

### DiamondCut

```solidity
event DiamondCut(IDiamondCut.FacetCut[] _diamondCut, address _init, bytes _calldata)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _diamondCut  | IDiamondCut.FacetCut[] | undefined |
| _init  | address | undefined |
| _calldata  | bytes | undefined |




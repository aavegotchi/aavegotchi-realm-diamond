# DiamondLoupeFacet









## Methods

### facetAddress

```solidity
function facetAddress(bytes4 _functionSelector) external view returns (address facetAddress_)
```

Gets the facet that supports the given selector.

*If facet is not found return address(0).*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _functionSelector | bytes4 | The function selector.

#### Returns

| Name | Type | Description |
|---|---|---|
| facetAddress_ | address | The facet address.

### facetAddresses

```solidity
function facetAddresses() external view returns (address[] facetAddresses_)
```

Get all the facet addresses used by a diamond.




#### Returns

| Name | Type | Description |
|---|---|---|
| facetAddresses_ | address[] | facetAddresses_

### facetFunctionSelectors

```solidity
function facetFunctionSelectors(address _facet) external view returns (bytes4[] _facetFunctionSelectors)
```

Gets all the function selectors supported by a specific facet.



#### Parameters

| Name | Type | Description |
|---|---|---|
| _facet | address | The facet address.

#### Returns

| Name | Type | Description |
|---|---|---|
| _facetFunctionSelectors | bytes4[] | The selectors associated with a facet address.

### facets

```solidity
function facets() external view returns (struct IDiamondLoupe.Facet[] facets_)
```

Gets all facets and their selectors.




#### Returns

| Name | Type | Description |
|---|---|---|
| facets_ | IDiamondLoupe.Facet[] | Facet

### supportsInterface

```solidity
function supportsInterface(bytes4 _interfaceId) external view returns (bool)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _interfaceId | bytes4 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined





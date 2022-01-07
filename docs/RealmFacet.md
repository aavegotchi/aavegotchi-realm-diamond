# RealmFacet









## Methods

### checkCoordinates

```solidity
function checkCoordinates(uint256 _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) external view
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | undefined
| _coordinateX | uint256 | undefined
| _coordinateY | uint256 | undefined
| _installationId | uint256 | undefined

### equipInstallation

```solidity
function equipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) external nonpayable
```

Allow a parcel owner to equip an installation

*The _x and _y denote the size of the installation and are used to make sure that slot is available on a parcel*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | The identifier of the parcel which the installation is being equipped on
| _installationId | uint256 | The identifier of the installation being equipped
| _x | uint256 | The x(horizontal) coordinate of the installation
| _y | uint256 | The y(vertical) coordinate of the installation

### getHumbleGrid

```solidity
function getHumbleGrid(uint256 _parcelId) external view returns (uint256[8][8] output_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _parcelId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| output_ | uint256[8][8] | undefined

### getPaartnerGrid

```solidity
function getPaartnerGrid(uint256 _parcelId) external view returns (uint256[64][64])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _parcelId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[64][64] | undefined

### getParcelCapacity

```solidity
function getParcelCapacity(uint256 _realmId) external view returns (uint256[4])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[4] | undefined

### getParcelInfo

```solidity
function getParcelInfo(uint256 _realmId) external view returns (struct RealmFacet.ParcelOutput output_)
```

Fetch information about a parcel



#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | The identifier of the parcel being queried

#### Returns

| Name | Type | Description |
|---|---|---|
| output_ | RealmFacet.ParcelOutput | A struct containing details about the parcel being queried

### getReasonableGrid

```solidity
function getReasonableGrid(uint256 _parcelId) external view returns (uint256[16][16] output_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _parcelId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| output_ | uint256[16][16] | undefined

### getSpaciousHorizontalGrid

```solidity
function getSpaciousHorizontalGrid(uint256 _parcelId) external view returns (uint256[64][32] output_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _parcelId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| output_ | uint256[64][32] | undefined

### getSpaciousVerticalGrid

```solidity
function getSpaciousVerticalGrid(uint256 _parcelId) external view returns (uint256[32][64] output_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _parcelId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| output_ | uint256[32][64] | undefined

### maxSupply

```solidity
function maxSupply() external pure returns (uint256)
```

Return the maximum realm supply




#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | The max realm token supply

### mintParcels

```solidity
function mintParcels(address _to, uint256[] _tokenIds, RealmFacet.MintParcelInput[] _metadata) external nonpayable
```

Allow the diamond owner to mint new parcels



#### Parameters

| Name | Type | Description |
|---|---|---|
| _to | address | The address to mint the parcels to
| _tokenIds | uint256[] | The identifiers of tokens to mint
| _metadata | RealmFacet.MintParcelInput[] | An array of structs containing the metadata of each parcel being minted

### resyncParcel

```solidity
function resyncParcel(uint256[] _tokenIds) external nonpayable
```



*Used to resync a parcel on the subgraph if metadata is added later *

#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenIds | uint256[] | The parcels to resync

### setAavegotchiDiamond

```solidity
function setAavegotchiDiamond(address _diamondAddress) external nonpayable
```



*Used to set diamond address for Baazaar*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _diamondAddress | address | New diamond address for the baazar

### unequipInstallation

```solidity
function unequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) external nonpayable
```

Allow a parcel owner to unequip an installation

*The _x and _y denote the size of the installation and are used to make sure that slot is available on a parcel*

#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | The identifier of the parcel which the installation is being unequipped from
| _installationId | uint256 | The identifier of the installation being unequipped
| _x | uint256 | The x(horizontal) coordinate of the installation
| _y | uint256 | The y(vertical) coordinate of the installation

### upgradeInstallation

```solidity
function upgradeInstallation(uint256 _realmId, uint256 _prevInstallationId, uint256 _nextInstallationId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId | uint256 | undefined
| _prevInstallationId | uint256 | undefined
| _nextInstallationId | uint256 | undefined



## Events

### EquipInstallation

```solidity
event EquipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId  | uint256 | undefined |
| _installationId  | uint256 | undefined |
| _x  | uint256 | undefined |
| _y  | uint256 | undefined |

### ResyncParcel

```solidity
event ResyncParcel(uint256 _realmId)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId  | uint256 | undefined |

### UnequipInstallation

```solidity
event UnequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _realmId  | uint256 | undefined |
| _installationId  | uint256 | undefined |
| _x  | uint256 | undefined |
| _y  | uint256 | undefined |




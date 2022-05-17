# InstallationFacet

## Methods

### addInstallationTypes

```solidity
function addInstallationTypes(InstallationType[] _installationTypes) external nonpayable
```

Allow the diamond owner to add an installation type

#### Parameters

| Name                | Type               | Description                                                                     |
| ------------------- | ------------------ | ------------------------------------------------------------------------------- |
| \_installationTypes | InstallationType[] | An array of structs, each struct representing each installationType to be added |

### balanceOfToken

```solidity
function balanceOfToken(address _tokenContract, uint256 _tokenId, uint256 _id) external view returns (uint256 value)
```

Get the balance of a non-fungible parent token

#### Parameters

| Name            | Type    | Description                            |
| --------------- | ------- | -------------------------------------- |
| \_tokenContract | address | The contract tracking the parent token |
| \_tokenId       | uint256 | The ID of the parent token             |
| \_id            | uint256 | ID of the token                        |

#### Returns

| Name  | Type    | Description              |
| ----- | ------- | ------------------------ |
| value | uint256 | The balance of the token |

### claimInstallations

```solidity
function claimInstallations(uint256[] _queueIds) external nonpayable
```

Allow a user to claim installations from ready queues

_Will throw if the caller is not the queue ownerWill throw if one of the queues is not ready_

#### Parameters

| Name       | Type      | Description                                            |
| ---------- | --------- | ------------------------------------------------------ |
| \_queueIds | uint256[] | An array containing the identifiers of queues to claim |

### craftInstallations

```solidity
function craftInstallations(uint256[] _installationTypes) external nonpayable
```

Allow a user to craft installations

_Will throw even if one of the installationTypes is deprecatedPuts the installation into a queue_

#### Parameters

| Name                | Type      | Description                                                           |
| ------------------- | --------- | --------------------------------------------------------------------- |
| \_installationTypes | uint256[] | An array containing the identifiers of the installationTypes to craft |

### deprecateInstallations

```solidity
function deprecateInstallations(uint256[] _installationIds) external nonpayable
```

Allow the Diamond owner to deprecate an installation

_Deprecated installations cannot be crafted by users_

#### Parameters

| Name              | Type      | Description                                                       |
| ----------------- | --------- | ----------------------------------------------------------------- |
| \_installationIds | uint256[] | An array containing the identifiers of installations to deprecate |

### editInstallationType

```solidity
function editInstallationType(uint256 _typeId, InstallationType _installationType) external nonpayable
```

Allow the diamond owner to edit an installationType

#### Parameters

| Name               | Type             | Description                                                                 |
| ------------------ | ---------------- | --------------------------------------------------------------------------- |
| \_typeId           | uint256          | Identifier of the installationType to edit                                  |
| \_installationType | InstallationType | A struct containing the new properties of the installationType being edited |

### equipInstallation

```solidity
function equipInstallation(address _owner, uint256 _realmId, uint256 _installationId) external nonpayable
```

Allow a user to equip an installation to a parcel

_Will throw if the caller is not the parcel diamond contractWill also throw if various prerequisites for the installation are not met_

#### Parameters

| Name             | Type    | Description                                               |
| ---------------- | ------- | --------------------------------------------------------- |
| \_owner          | address | Owner of the installation to equip                        |
| \_realmId        | uint256 | The identifier of the parcel to equip the installation to |
| \_installationId | uint256 | Identifier of the installation to equip                   |

### eraseInstallationTypes

```solidity
function eraseInstallationTypes() external nonpayable
```

Allow the diamond owner to delete all installationTypes

### finalizeUpgrade

```solidity
function finalizeUpgrade() external nonpayable
```

Allow anyone to finalize any existing queue upgrade

_Only three queue upgrades can be finalized in one transaction_

### getAlchemicaAddresses

```solidity
function getAlchemicaAddresses() external view returns (address[])
```

Query the alchemica token addresses

#### Returns

| Name | Type      | Description                                       |
| ---- | --------- | ------------------------------------------------- |
| \_0  | address[] | An array containing the alchemica token addresses |

### getAltarIds

```solidity
function getAltarIds() external pure returns (uint256[])
```

Return the id for all the altars

#### Returns

| Name | Type      | Description                                               |
| ---- | --------- | --------------------------------------------------------- |
| \_0  | uint256[] | An array of 9 integers, each one representing an altar id |

### getCraftQueue

```solidity
function getCraftQueue(address _owner) external view returns (struct QueueItem[] output_)
```

Query details about all ongoing craft queues

#### Parameters

| Name    | Type    | Description      |
| ------- | ------- | ---------------- |
| \_owner | address | Address to query |

#### Returns

| Name     | Type        | Description                                                   |
| -------- | ----------- | ------------------------------------------------------------- |
| output\_ | QueueItem[] | An array of structs, each representing an ongoing craft queue |

### getInstallationType

```solidity
function getInstallationType(uint256 _installationTypeId) external view returns (struct InstallationType installationType)
```

Query the item type of a particular installation

#### Parameters

| Name                 | Type    | Description   |
| -------------------- | ------- | ------------- |
| \_installationTypeId | uint256 | Item to query |

#### Returns

| Name             | Type             | Description                                                                          |
| ---------------- | ---------------- | ------------------------------------------------------------------------------------ |
| installationType | InstallationType | A struct containing details about the item type of an item with identifier `_itemId` |

### getInstallationTypes

```solidity
function getInstallationTypes(uint256[] _installationTypeIds) external view returns (struct InstallationType[] installationTypes_)
```

Query the item type of multiple installation types

#### Parameters

| Name                  | Type      | Description                                           |
| --------------------- | --------- | ----------------------------------------------------- |
| \_installationTypeIds | uint256[] | An array containing the identifiers of items to query |

#### Returns

| Name                | Type               | Description                                                                                      |
| ------------------- | ------------------ | ------------------------------------------------------------------------------------------------ |
| installationTypes\_ | InstallationType[] | An array of structs,each struct containing details about the item type of the corresponding item |

### getUpgradeQueue

```solidity
function getUpgradeQueue() external view returns (struct UpgradeQueue[] output_)
```

Query details about all ongoing upgrade queues

#### Returns

| Name     | Type           | Description                                                     |
| -------- | -------------- | --------------------------------------------------------------- |
| output\_ | UpgradeQueue[] | An array of structs, each representing an ongoing upgrade queue |

### installationBalancesOfToken

```solidity
function installationBalancesOfToken(address _tokenContract, uint256 _tokenId) external view returns (struct InstallationFacet.InstallationIdIO[] bals_)
```

Returns the balances for all ERC1155 items for a ERC721 token

#### Parameters

| Name            | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| \_tokenContract | address | Contract address for the token to query |
| \_tokenId       | uint256 | Identifier of the token to query        |

#### Returns

| Name   | Type                                 | Description                                                  |
| ------ | ------------------------------------ | ------------------------------------------------------------ |
| bals\_ | InstallationFacet.InstallationIdIO[] | An array of structs containing details about each item owned |

### installationBalancesOfTokenByIds

```solidity
function installationBalancesOfTokenByIds(address _tokenContract, uint256 _tokenId, uint256[] _ids) external view returns (uint256[])
```

Query the installation balances of an ERC721 parent token

#### Parameters

| Name            | Type      | Description                                                   |
| --------------- | --------- | ------------------------------------------------------------- |
| \_tokenContract | address   | The token contract of the ERC721 parent token                 |
| \_tokenId       | uint256   | The identifier of the ERC721 parent token                     |
| \_ids           | uint256[] | An array containing the ids of the installationTypes to query |

#### Returns

| Name | Type      | Description                                                                      |
| ---- | --------- | -------------------------------------------------------------------------------- |
| \_0  | uint256[] | An array containing the corresponding balances of the installation types queried |

### installationBalancesOfTokenWithTypes

```solidity
function installationBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId) external view returns (struct ItemTypeIO[] installationBalancesOfTokenWithTypes_)
```

Returns the balances for all ERC1155 items for a ERC721 token

#### Parameters

| Name            | Type    | Description                             |
| --------------- | ------- | --------------------------------------- |
| \_tokenContract | address | Contract address for the token to query |
| \_tokenId       | uint256 | Identifier of the token to query        |

#### Returns

| Name                                   | Type         | Description                                                                                        |
| -------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------- |
| installationBalancesOfTokenWithTypes\_ | ItemTypeIO[] | An array of structs containing details about each installation owned(including installation types) |

### installationsBalances

```solidity
function installationsBalances(address _account) external view returns (struct InstallationFacet.InstallationIdIO[] bals_)
```

Returns balance for each installation that exists for an account

#### Parameters

| Name      | Type    | Description                     |
| --------- | ------- | ------------------------------- |
| \_account | address | Address of the account to query |

#### Returns

| Name   | Type                                 | Description                                                                      |
| ------ | ------------------------------------ | -------------------------------------------------------------------------------- |
| bals\_ | InstallationFacet.InstallationIdIO[] | An array of structs,each struct containing details about each installation owned |

### installationsBalancesWithTypes

```solidity
function installationsBalancesWithTypes(address _owner) external view returns (struct ItemTypeIO[] output_)
```

Returns balance for each installation(and their types) that exists for an account

#### Parameters

| Name    | Type    | Description                     |
| ------- | ------- | ------------------------------- |
| \_owner | address | Address of the account to query |

#### Returns

| Name     | Type         | Description                                                                                            |
| -------- | ------------ | ------------------------------------------------------------------------------------------------------ |
| output\_ | ItemTypeIO[] | An array of structs containing details about each installation owned(including the installation types) |

### reduceCraftTime

```solidity
function reduceCraftTime(uint256[] _queueIds, uint256[] _amounts) external nonpayable
```

Allow a user to speed up multiple queues(installation craft time) by paying the correct amount of $GLTR tokens

_Will throw if the caller is not the queue owner$GLTR tokens are burnt upon usage_

#### Parameters

| Name       | Type      | Description                                                                                 |
| ---------- | --------- | ------------------------------------------------------------------------------------------- |
| \_queueIds | uint256[] | An array containing the identifiers of queues to speed up                                   |
| \_amounts  | uint256[] | An array containing the corresponding amounts of $GLTR tokens to pay for each queue speedup |

### reduceUpgradeTime

```solidity
function reduceUpgradeTime(uint256 _queueId, uint256 _amount) external nonpayable
```

Allow a user to reduce the upgrade time of an ongoing queue

_Will throw if the caller is not the owner of the queue_

#### Parameters

| Name      | Type    | Description                                                     |
| --------- | ------- | --------------------------------------------------------------- |
| \_queueId | uint256 | The identifier of the queue whose upgrade time is to be reduced |
| \_amount  | uint256 | The correct amount of $GLTR token to be paid                    |

### setAddresses

```solidity
function setAddresses(address _aavegotchiDiamond, address _realmDiamond, address _gltr) external nonpayable
```

Allow the diamond owner to set some important contract addresses

#### Parameters

| Name                | Type    | Description                    |
| ------------------- | ------- | ------------------------------ |
| \_aavegotchiDiamond | address | The aavegotchi diamond address |
| \_realmDiamond      | address | The Realm diamond address      |
| \_gltr              | address | The $GLTR token address        |

### setAlchemicaAddresses

```solidity
function setAlchemicaAddresses(address[] _addresses) external nonpayable
```

Allow the diamond owner to set the alchemica addresses

#### Parameters

| Name        | Type      | Description                                       |
| ----------- | --------- | ------------------------------------------------- |
| \_addresses | address[] | An array containing the alchemica token addresses |

### spilloverRadiusOfId

```solidity
function spilloverRadiusOfId(uint256 _id) external view returns (uint256)
```

Check the spillover radius of an installation type

#### Parameters

| Name | Type    | Description                         |
| ---- | ------- | ----------------------------------- |
| \_id | uint256 | id of the installationType to query |

#### Returns

| Name | Type    | Description                                                          |
| ---- | ------- | -------------------------------------------------------------------- |
| \_0  | uint256 | the spillover radius rate the installation type with identifier \_id |

### spilloverRadiusOfIds

```solidity
function spilloverRadiusOfIds(uint256[] _ids) external view returns (uint256[])
```

Check the spillover radius of multiple installation types

#### Parameters

| Name  | Type      | Description                                               |
| ----- | --------- | --------------------------------------------------------- |
| \_ids | uint256[] | An array containing ids of the installationTypes to query |

#### Returns

| Name | Type      | Description                                                                              |
| ---- | --------- | ---------------------------------------------------------------------------------------- |
| \_0  | uint256[] | An array containing the corresponding spillover radius of the installation types queried |

### spilloverRateOfId

```solidity
function spilloverRateOfId(uint256 _id) external view returns (uint256)
```

Check the spillover rate of an installation type

#### Parameters

| Name | Type    | Description                         |
| ---- | ------- | ----------------------------------- |
| \_id | uint256 | id of the installationType to query |

#### Returns

| Name | Type    | Description                                                   |
| ---- | ------- | ------------------------------------------------------------- |
| \_0  | uint256 | the spillover rate the installation type with identifier \_id |

### spilloverRatesOfIds

```solidity
function spilloverRatesOfIds(uint256[] _ids) external view returns (uint256[])
```

Check the spillover rates of multiple installation types

#### Parameters

| Name  | Type      | Description                                               |
| ----- | --------- | --------------------------------------------------------- |
| \_ids | uint256[] | An array containing ids of the installationTypes to query |

#### Returns

| Name | Type      | Description                                                                             |
| ---- | --------- | --------------------------------------------------------------------------------------- |
| \_0  | uint256[] | An array containing the corresponding spillover rates of the installation types queried |

### spilloverRateAndRadiusOfId

```solidity
function spilloverRateAndRadiusOfId(uint256 _id) external view returns (uint256, uint256)
```

Check the spillover rate and radius of an installation type

#### Parameters

| Name | Type    | Description                         |
| ---- | ------- | ----------------------------------- |
| \_id | uint256 | id of the installationType to query |

#### Returns

| Name | Type    | Description                                                     |
| ---- | ------- | --------------------------------------------------------------- |
| \_0  | uint256 | the spillover rate the installation type with identifier \_id   |
| \_1  | uint256 | the spillover radius the installation type with identifier \_id |

### unequipInstallation

```solidity
function unequipInstallation(address _owner, uint256 _realmId, uint256 _installationId) external nonpayable
```

Allow a user to unequip an installation from a parcel

_Will throw if the caller is not the parcel diamond contract_

#### Parameters

| Name             | Type    | Description                                                   |
| ---------------- | ------- | ------------------------------------------------------------- |
| \_owner          | address | Owner of the installation to unequip                          |
| \_realmId        | uint256 | The identifier of the parcel to unequip the installation from |
| \_installationId | uint256 | Identifier of the installation to unequip                     |

### upgradeInstallation

```solidity
function upgradeInstallation(UpgradeQueue _upgradeQueue) external nonpayable
```

Allow a user to upgrade an installation in a parcel

_Will throw if the caller is not the owner of the parcel in which the installation is installed_

#### Parameters

| Name           | Type         | Description                                                                            |
| -------------- | ------------ | -------------------------------------------------------------------------------------- |
| \_upgradeQueue | UpgradeQueue | A struct containing details about the queue which contains the installation to upgrade |

### uri

```solidity
function uri(uint256 _id) external view returns (string)
```

Get the URI for a voucher type

#### Parameters

| Name | Type    | Description |
| ---- | ------- | ----------- |
| \_id | uint256 | undefined   |

#### Returns

| Name | Type   | Description        |
| ---- | ------ | ------------------ |
| \_0  | string | URI for token type |

## Events

### AddedToQueue

```solidity
event AddedToQueue(uint256 indexed _queueId, uint256 indexed _installationId, uint256 _readyBlock, address _sender)
```

#### Parameters

| Name                       | Type    | Description |
| -------------------------- | ------- | ----------- |
| \_queueId `indexed`        | uint256 | undefined   |
| \_installationId `indexed` | uint256 | undefined   |
| \_readyBlock               | uint256 | undefined   |
| \_sender                   | address | undefined   |

### CraftTimeReduced

```solidity
event CraftTimeReduced(uint256 indexed _queueId, uint256 _blocksReduced)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| \_queueId `indexed` | uint256 | undefined   |
| \_blocksReduced     | uint256 | undefined   |

### QueueClaimed

```solidity
event QueueClaimed(uint256 indexed _queueId)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| \_queueId `indexed` | uint256 | undefined   |

### UpgradeFinalized

```solidity
event UpgradeFinalized(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| \_realmId `indexed` | uint256 | undefined   |
| \_coordinateX       | uint256 | undefined   |
| \_coordinateY       | uint256 | undefined   |

### UpgradeInitiated

```solidity
event UpgradeInitiated(uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 blockInitiated, uint256 readyBlock)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| \_realmId `indexed` | uint256 | undefined   |
| \_coordinateX       | uint256 | undefined   |
| \_coordinateY       | uint256 | undefined   |
| blockInitiated      | uint256 | undefined   |
| readyBlock          | uint256 | undefined   |

### UpgradeTimeReduced

```solidity
event UpgradeTimeReduced(uint256 indexed _queueId, uint256 indexed _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _blocksReduced)
```

#### Parameters

| Name                | Type    | Description |
| ------------------- | ------- | ----------- |
| \_queueId `indexed` | uint256 | undefined   |
| \_realmId `indexed` | uint256 | undefined   |
| \_coordinateX       | uint256 | undefined   |
| \_coordinateY       | uint256 | undefined   |
| \_blocksReduced     | uint256 | undefined   |

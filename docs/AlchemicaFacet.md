# AlchemicaFacet

## Methods

### channelAlchemica

```solidity
function channelAlchemica(uint256 _realmId, uint256 _gotchiId, uint256 _lastChanneled, bytes _signature) external nonpayable
```

Allow a parcel owner to channel alchemica

_This transfers alchemica to the parent ERC721 token with id \_gotchiId and also to the great portal_

#### Parameters

| Name            | Type    | Description                                                            |
| --------------- | ------- | ---------------------------------------------------------------------- |
| \_realmId       | uint256 | Identifier of parcel where alchemica is being channeled from           |
| \_gotchiId      | uint256 | Identifier of parent ERC721 aavegotchi which alchemica is channeled to |
| \_lastChanneled | uint256 | The last time alchemica was channeled in this \_realmId                |
| \_signature     | bytes   | Message signature used for backend validation                          |

### claimAvailableAlchemica

```solidity
function claimAvailableAlchemica(uint256 _realmId, uint256 _alchemicaType, uint256 _gotchiId, bytes _signature) external nonpayable
```

Allow parcel owner to claim available alchemica with his parent NFT(Aavegotchi)

#### Parameters

| Name            | Type    | Description                                                        |
| --------------- | ------- | ------------------------------------------------------------------ |
| \_realmId       | uint256 | Identifier of parcel to claim alchemica from                       |
| \_alchemicaType | uint256 | Alchemica to claim                                                 |
| \_gotchiId      | uint256 | Identifier of Aavegotchi to use for alchemica collecction/claiming |
| \_signature     | bytes   | Message signature used for backend validation                      |

### exitAlchemica

```solidity
function exitAlchemica(uint256[] _alchemica, uint256 _gotchiId, uint256 _lastExitTime, bytes _signature) external nonpayable
```

Allow the game manager to transfer alchemica to a certain ERC721 parent aavegotchi

#### Parameters

| Name           | Type      | Description                                                              |
| -------------- | --------- | ------------------------------------------------------------------------ |
| \_alchemica    | uint256[] | Identifiers of alchemica tokens to transfer                              |
| \_gotchiId     | uint256   | Identifier of parent ERC721 aavegotchi which alchemica is transferred to |
| \_lastExitTime | uint256   | The last time alchemica was exited/transferred to \_gotchiId             |
| \_signature    | bytes     | Message signature used for backend validation                            |

### getAltarSpilloverRate

```solidity
function getAltarSpilloverRate(uint256 _realmId) external view returns (uint256)
```

Query the Altar spillover rate

#### Parameters

| Name      | Type    | Description                   |
| --------- | ------- | ----------------------------- |
| \_realmId | uint256 | Identifier of portal to query |

#### Returns

| Name | Type    | Description               |
| ---- | ------- | ------------------------- |
| \_0  | uint256 | The portal spillover rate |

### getAvailableAlchemica

```solidity
function getAvailableAlchemica(uint256 _realmId) external view returns (uint256[4] _availableAlchemica)
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_realmId | uint256 | undefined   |

#### Returns

| Name                 | Type       | Description                                                |
| -------------------- | ---------- | ---------------------------------------------------------- |
| \_availableAlchemica | uint256[4] | An array representing the available quantity of alchemicas |

### getRealmAlchemica

```solidity
function getRealmAlchemica(uint256 _realmId) external view returns (uint256[4])
```

Query details about the remaining alchemica in a parcel

#### Parameters

| Name      | Type    | Description                           |
| --------- | ------- | ------------------------------------- |
| \_realmId | uint256 | The identifier of the parcel to query |

#### Returns

| Name | Type       | Description                                                                       |
| ---- | ---------- | --------------------------------------------------------------------------------- |
| \_0  | uint256[4] | output\_ An array containing details about each remaining alchemica in the parcel |

### getReservoirSpilloverRate

```solidity
function getReservoirSpilloverRate(uint256 _realmId, uint256 _alchemicaType) external view returns (uint256)
```

Query the Reservoir spillover rate of a particular alchemica in a parcel

#### Parameters

| Name            | Type    | Description                   |
| --------------- | ------- | ----------------------------- |
| \_realmId       | uint256 | Identifier of parcel to query |
| \_alchemicaType | uint256 | Alchemica to query            |

#### Returns

| Name | Type    | Description                                                         |
| ---- | ------- | ------------------------------------------------------------------- |
| \_0  | uint256 | The reservoir spillover rate of the alchemica in the queried parcel |

### getRoundAlchemica

```solidity
function getRoundAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[])
```

Query details about all alchemica gathered in a surveying round in a parcel

#### Parameters

| Name      | Type    | Description                                |
| --------- | ------- | ------------------------------------------ |
| \_realmId | uint256 | Identifier of the parcel to query          |
| \_roundId | uint256 | Identifier of the surveying round to query |

#### Returns

| Name | Type      | Description                                                                 |
| ---- | --------- | --------------------------------------------------------------------------- |
| \_0  | uint256[] | output\_ An array representing the numbers of alchemica gathered in a round |

### getRoundBaseAlchemica

```solidity
function getRoundBaseAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[])
```

Query details about the base alchemica gathered in a surveying round in a parcel

#### Parameters

| Name      | Type    | Description                                |
| --------- | ------- | ------------------------------------------ |
| \_realmId | uint256 | Identifier of the parcel to query          |
| \_roundId | uint256 | Identifier of the surveying round to query |

#### Returns

| Name | Type      | Description                                                                      |
| ---- | --------- | -------------------------------------------------------------------------------- |
| \_0  | uint256[] | output\_ An array representing the numbers of base alchemica gathered in a round |

### getTotalAlchemicas

```solidity
function getTotalAlchemicas() external view returns (uint256[4][5])
```

Query details about all total alchemicas present

#### Returns

| Name | Type          | Description                                                            |
| ---- | ------------- | ---------------------------------------------------------------------- |
| \_0  | uint256[4][5] | output\_ A two dimensional array, each representing an alchemica value |

### progressSurveyingRound

```solidity
function progressSurveyingRound() external nonpayable
```

Allow the diamond owner to increment the surveying round

### setAlchemicaAddresses

```solidity
function setAlchemicaAddresses(address[4] _addresses) external nonpayable
```

Allow the diamond owner to set the alchemica addresses

#### Parameters

| Name        | Type       | Description                                       |
| ----------- | ---------- | ------------------------------------------------- |
| \_addresses | address[4] | An array containing the alchemica token addresses |

### setVars

```solidity
function setVars(uint256[4][5] _alchemicas, uint256[4] _boostMultipliers, uint256[4] _greatPortalCapacity, address _installationsDiamond, address _vrfCoordinator, address _linkAddress, address[4] _alchemicaAddresses, bytes _backendPubKey, address _gameManager) external nonpayable
```

Allow the diamond owner to set some important diamond state variables

#### Parameters

| Name                   | Type          | Description                                                  |
| ---------------------- | ------------- | ------------------------------------------------------------ |
| \_alchemicas           | uint256[4][5] | A nested array containing the amount of alchemicas available |
| \_boostMultipliers     | uint256[4]    | The boost multiplers applied to each parcel                  |
| \_greatPortalCapacity  | uint256[4]    | The individual alchemica capacity of the great portal        |
| \_installationsDiamond | address       | The installations diamond address                            |
| \_vrfCoordinator       | address       | The chainlink vrfCoordinator address                         |
| \_linkAddress          | address       | The link token address                                       |
| \_alchemicaAddresses   | address[4]    | The four alchemica token addresses                           |
| \_backendPubKey        | bytes         | The Realm(gotchiverse) backend public key                    |
| \_gameManager          | address       | The address of the game manager                              |

### startSurveying

```solidity
function startSurveying(uint256 _realmId) external nonpayable
```

Allow the owner of a parcel to start surveying his parcel

_Will throw if a surveying round has not started_

#### Parameters

| Name      | Type    | Description                        |
| --------- | ------- | ---------------------------------- |
| \_realmId | uint256 | Identifier of the parcel to survey |

### testingAlchemicaFaucet

```solidity
function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external nonpayable
```

#### Parameters

| Name            | Type    | Description |
| --------------- | ------- | ----------- |
| \_alchemicaType | uint256 | undefined   |
| \_amount        | uint256 | undefined   |

### testingMintParcel

```solidity
function testingMintParcel(address _to, uint256[] _tokenIds, RealmFacet.MintParcelInput[] _metadata) external nonpayable
```

#### Parameters

| Name       | Type                         | Description |
| ---------- | ---------------------------- | ----------- |
| \_to       | address                      | undefined   |
| \_tokenIds | uint256[]                    | undefined   |
| \_metadata | RealmFacet.MintParcelInput[] | undefined   |

### testingStartSurveying

```solidity
function testingStartSurveying(uint256 _realmId) external nonpayable
```

#### Parameters

| Name      | Type    | Description |
| --------- | ------- | ----------- |
| \_realmId | uint256 | undefined   |

## Events

### AlchemicaClaimed

```solidity
event AlchemicaClaimed(uint256 indexed _realmId, uint256 indexed _gotchiId, uint256 indexed _alchemicaType, uint256 _amount, uint256 _spilloverRate, uint256 _spilloverRadius)
```

#### Parameters

| Name                      | Type    | Description |
| ------------------------- | ------- | ----------- |
| \_realmId `indexed`       | uint256 | undefined   |
| \_gotchiId `indexed`      | uint256 | undefined   |
| \_alchemicaType `indexed` | uint256 | undefined   |
| \_amount                  | uint256 | undefined   |
| \_spilloverRate           | uint256 | undefined   |
| \_spilloverRadius         | uint256 | undefined   |

### ChannelAlchemica

```solidity
event ChannelAlchemica(uint256 indexed _realmId, uint256 indexed _gotchiId, uint256[4] _alchemica, uint256 _spilloverRate, uint256 _spilloverRadius)
```

#### Parameters

| Name                 | Type       | Description |
| -------------------- | ---------- | ----------- |
| \_realmId `indexed`  | uint256    | undefined   |
| \_gotchiId `indexed` | uint256    | undefined   |
| \_alchemica          | uint256[4] | undefined   |
| \_spilloverRate      | uint256    | undefined   |
| \_spilloverRadius    | uint256    | undefined   |

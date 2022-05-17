# InstallationDiamondInterface









## Methods

### addInstallationTypes

```solidity
function addInstallationTypes(InstallationDiamondInterface.InstallationType[] _installationTypes) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _installationTypes | InstallationDiamondInterface.InstallationType[] | undefined

### balanceOf

```solidity
function balanceOf(address _owner, uint256 _id) external view returns (uint256 bal_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined
| _id | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| bal_ | uint256 | undefined

### claimInstallations

```solidity
function claimInstallations(uint256[] _queueIds) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _queueIds | uint256[] | undefined

### craftInstallations

```solidity
function craftInstallations(uint256[] _installationTypes) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _installationTypes | uint256[] | undefined

### equipInstallation

```solidity
function equipInstallation(address _owner, uint256 _realmTokenId, uint256 _installationId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined
| _realmTokenId | uint256 | undefined
| _installationId | uint256 | undefined

### finalizeUpgrade

```solidity
function finalizeUpgrade() external nonpayable
```






### getAlchemicaAddresses

```solidity
function getAlchemicaAddresses() external view returns (address[])
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address[] | undefined

### getAltarIds

```solidity
function getAltarIds() external pure returns (uint256[])
```






#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined

### getInstallationType

```solidity
function getInstallationType(uint256 _itemId) external view returns (struct InstallationDiamondInterface.InstallationType installationType)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _itemId | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| installationType | InstallationDiamondInterface.InstallationType | undefined

### getInstallationTypes

```solidity
function getInstallationTypes(uint256[] _itemIds) external view returns (struct InstallationDiamondInterface.InstallationType[] itemTypes_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _itemIds | uint256[] | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| itemTypes_ | InstallationDiamondInterface.InstallationType[] | undefined

### installationBalancesOfTokenByIds

```solidity
function installationBalancesOfTokenByIds(address _tokenContract, uint256 _tokenId, uint256[] _ids) external view returns (uint256[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _tokenContract | address | undefined
| _tokenId | uint256 | undefined
| _ids | uint256[] | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined

### installationsBalances

```solidity
function installationsBalances(address _account) external view returns (struct InstallationDiamondInterface.InstallationIdIO[] bals_)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _account | address | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| bals_ | InstallationDiamondInterface.InstallationIdIO[] | undefined

### setAlchemicaAddresses

```solidity
function setAlchemicaAddresses(address[] _addresses) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _addresses | address[] | undefined

### spilloverRadiusOfId

```solidity
function spilloverRadiusOfId(uint256 _id) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _id | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### spilloverRadiusOfIds

```solidity
function spilloverRadiusOfIds(uint256[] _ids) external view returns (uint256[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _ids | uint256[] | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined

### spilloverRateOfId

```solidity
function spilloverRateOfId(uint256 _id) external view returns (uint256)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _id | uint256 | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined

### spilloverRatesOfIds

```solidity
function spilloverRatesOfIds(uint256[] _ids) external view returns (uint256[])
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _ids | uint256[] | undefined

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256[] | undefined

### spilloverRateAndRadiusOfId

```solidity
function spilloverRateAndRadiusOfId(uint256 _id) external view returns (uint256, uint256)
```



#### Parameters

| Name | Type | Description |
|---|---|---|
| _id | uint256 | undefined

#### Returns

| Name | Type | Description |
|------|---|---|
| _0   | uint256 | undefined
| _1   | uint256 | undefined

### unequipInstallation

```solidity
function unequipInstallation(address _owner, uint256 _realmId, uint256 _installationId) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _owner | address | undefined
| _realmId | uint256 | undefined
| _installationId | uint256 | undefined

### upgradeInstallation

```solidity
function upgradeInstallation(InstallationDiamondInterface.UpgradeQueue _upgradeQueue) external nonpayable
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| _upgradeQueue | InstallationDiamondInterface.UpgradeQueue | undefined





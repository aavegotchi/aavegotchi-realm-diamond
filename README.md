# Aavegotchi REALM Diamond

## How to Test

- Clone repo
- `npm install`
- Generate types: `npx hardhat typechain`. If doesn't work, use `TS_NODE_TRANSPILE_ONLY=1 npx hardhat compile`
- Test scripts:
  - `realm/harvestingTest.ts`
  - `realm/spilloverTest.ts`
  - `equipInstallationTest.ts`
  - `surveyingTest.ts`

## Deployed Vars

### Matic (Final)

- RealmDiamond ERC721 deployed: 0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11
- InstallationDiamond ERC1155 deployed: 0x19f870bD94A34b3adAa9CaA439d333DA18d6812A
- TileDiamond ERC1155 deployed: 0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355
- Aavegotchi FUD ERC20 - 0x403E967b044d4Be25170310157cB1A4Bf10bdD0f
- Aavegotchi FOMO ERC20 - 0x44A6e0BE76e1D9620A7F76588e4509fE4fa8E8C8
- Aavegotchi ALPHA ERC20 - 0x6a3E7C3c6EF65Ee26975b12293cA1AAD7e1dAeD2
- Aavegotchi KEK ERC20 - 0x42E5E06EF5b90Fe15F853F59299Fc96259209c5C
- Link: https://louper.dev/diamond/0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11?network=polygon

### Mumbai

- Diamond owner: 0x382038b034fa8Ea64C74C81d680669bDaC4D0636

- Realm Diamond: 0xBcCf68d104aCEa36b1EA20BBE8f06ceD12CaC008
- Installation Diamond: 0x2fD1C70728f686AE5f30734C20924a0Db1Df14e6
- Tile Diamond: 0xCbc2682E1Dd543557174c4168Ce33c7B358f5a1B

- FUD: 0x1D349EB5c7FBC586892C8903B0565cf1684ef111
- FOMO: 0xd33259671Db89b82d6fFf0ed043FeCcEB6D72270
- ALPHA: 0xbC59FD59163E9F32Be1E1c836fBADd34525cf798
- KEK: 0x419Cd8C320C485A2169C5Bc7FAA49f563Cd16B78
- GLTR: 0xcBcDae5769d31B468402e695a32277E29b1FEc06

### Kovan

- DiamondCutFacet deployed: 0xe59F49041A4bfD6E64A7C51c555650a6952F9f62
- Diamond deployed: 0xa37D0c085121B6b7190A34514Ca28fC15Bb4dc22
- DiamondInit deployed: 0x835b3034dCF252148bE27696FBcc8e4f4ff27D46
- DiamondLoupeFacet deployed: 0x835b3034dCF252148bE27696FBcc8e4f4ff27D46
- OwnershipFacet deployed: 0x835b3034dCF252148bE27696FBcc8e4f4ff27D46
- ERC721Facet deployed: 0x835b3034dCF252148bE27696FBcc8e4f4ff27D46
- RealmFacet deployed: 0x8f5f9150a1A09757A6874c941A8369Bdb6C2155D

### Installation Types

- 0 = altar
- 1 = harvester
- 2 = reservoir
- 3 = gotchi lodge
- 4 = wall
- 5 = NFT display
- 6 = buildqueue booster

### Foundry Support

- Install foundry and run foundryup
- Use command "make update-submodules" to update required submodules
- See Makefile for all commands

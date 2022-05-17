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

- TileDiamond: 0x0aB1547B21D81eB3af1712c0BD8ac21c0c1219a9

### Mumbai

- RealmDiamond deployed: 0xb012732d259df648B8B3876b9794Fcb631262447
- InstallationDiamond deployed: 0x4638B8127D1FC1bb69732c8D82Ea0Ab487A79e23
- FUD deployed: 0x82A8299C030Cb25dc15d466E81F5Eb8F4F52d216
- FOMO deployed: 0x92403c196c1b6BC037d8dA9977401bC5A947fA9e
- ALPHA deployed: 0x93ab15e06892EBaDdEff575DB0054760ca2488BF
- KEK deployed: 0x6781B5807bc76A9F09f5276c50B284F50da01e20
- GLTR deployed: 0x8Aa8A08Be25015aDaf6af9C4716DEb8d39bd801F
- Tile Diamond deployed: 0xf798165eaC975a7C98b1e351Eb36482A7b3a164f

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

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

- RealmDiamond deployed: 0x726F201A9aB38cD56D60ee392165F1434C4F193D
- InstallationDiamond deployed: 0x663aeA831087487d2944ce44836F419A35Ee005A
- FUD deployed: 0x8898BEA7EBC534263d891aCE9fdf8B18F0205ddb
- FOMO deployed: 0x18c2F784B51b04ba6E85bF62D74898Fac5BCC59b
- ALPHA deployed: 0x066F7B9172DE92945dF4e7fB29a0815dc225d45F
- KEK deployed: 0x1C5714F00cc2e795Cf4F4F7e2A9F3AA04149d423
- GLTR deployed: 0x3FF9E39009bfFe903C262f6d63161B1f4414d3c8
- Tile Diamond deployed: 0xDd8947D7F6705136e5A12971231D134E80DFC15d

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

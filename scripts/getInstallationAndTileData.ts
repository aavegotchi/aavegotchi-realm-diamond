import { Alchemy, Network } from "alchemy-sdk";
import { ethers } from "hardhat";
import fs, { existsSync } from "fs";
import { varsForNetwork } from "../constants";

export const excludedAddresses = [
  "0x0000000000000000000000000000000000000000",
  "0x000000000000000000000000000000000000dEaD",
  "0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF",
];

export const vault = "0xdd564df884fd4e217c9ee6f65b4ba6e5641eac63";
// Configures the Alchemy SDK
const config = {
  apiKey: process.env.ALCHEMY_KEY,
  network: Network.MATIC_MAINNET,
};

interface TokenHolder {
  ownerAddress: string;
  tokenBalances: {
    tokenId: string;
    balance: string;
  }[];
}

interface ContractEOAHolder {
  contractOwner: string;
  tokens: TokenHolder;
}

const CONTRACTS = {
  installations: "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A",
  tiles: "0x9216c31d8146bCB3eA5a9162Dc1702e8AEDCa355",
} as const;

const FILES = {
  //all normal installation holders
  installations: `${__dirname}/cloneData/installations-balances.json`,
  //all normal tile holders
  tiles: `${__dirname}/cloneData/tiles-balances.json`,
  //all irregular contracts that hold installations
  installationsContracts: `${__dirname}/cloneData/installations-contractsHolders.json`,
  //all irregular contracts that hold tiles
  tilesContracts: `${__dirname}/cloneData/tiles-contractsHolders.json`,
  //all installations held by the vault
  vaultInstallations: `${__dirname}/cloneData/vault-installations.json`,
  //all tiles held by the vault
  vaultTiles: `${__dirname}/cloneData/vault-tiles.json`,
  //all installations held by the realm diamond
  realmDiamondInstallations: `${__dirname}/cloneData/realmDiamond-installations.json`,
  //all tiles held by the realm diamond
  realmDiamondTiles: `${__dirname}/cloneData/realmDiamond-tiles.json`,
  //all regular contracts with valid owners that hold installations
  installationsContractHolderEOAs: `${__dirname}/cloneData/installations-EOAs.json`,
  //all regular contracts with valid owners that hold tiles
  tilesContractHolderEOAs: `${__dirname}/cloneData/tiles-EOAs.json`,
} as const;

const alchemy = new Alchemy(config);

async function updateHolderData(
  contractAddress: string,
  filename: string,
  contractHoldersFilename: string,
  realmDiamondFilename: string,
  vaultFilename: string,
  contractHolderEOAsFilename: string
) {
  const c = await varsForNetwork(ethers);
  const dir = `${__dirname}/cloneData/`;
  if (!existsSync(dir)) {
    fs.mkdirSync(dir);
  }
  const response = await alchemy.nft.getOwnersForContract(contractAddress, {
    withTokenBalances: true,
  });
  let holders: TokenHolder[] = response.owners;

  let existingData = {};

  if (existsSync(filename)) {
    const fileContent = await fs.readFileSync(filename, "utf8");
    existingData = JSON.parse(fileContent);
  }

  const contractHolders: TokenHolder[] = [];
  const realmDiamondHolders: TokenHolder[] = [];
  const vaultHolders: TokenHolder[] = [];
  const contractEOAs: ContractEOAHolder[] = [];
  // const realmDiamondEOAs: string[] = [];
  // const vaultEOAs: string[] = [];
  console.log(holders.length);

  for (let i = 0; i < holders.length; i++) {
    const holder = holders[i];
    const { ownerAddress } = holder;

    // Skip excluded addresses immediately
    if (excludedAddresses.includes(ownerAddress)) {
      continue;
    }

    existingData[ownerAddress] = holder;

    if (ownerAddress.toLowerCase() === c.realmDiamond.toLowerCase()) {
      realmDiamondHolders.push(holder);
      delete existingData[ownerAddress];
    } else if (ownerAddress.toLowerCase() === vault.toLowerCase()) {
      vaultHolders.push(holder);
      delete existingData[ownerAddress];
    } else {
      const code = await ethers.provider.getCode(ownerAddress);
      if (code !== "0x") {
        const contractOwner = await getOwner(ownerAddress);
        if (contractOwner) {
          contractEOAs.push({
            contractOwner: contractOwner,
            tokens: holder,
          });
        } else {
          contractHolders.push(holder);
        }
        delete existingData[ownerAddress];
      }
    }

    console.log(`processed ${i + 1} of ${holders.length} holders`);
  }

  const writePromises = [
    fs.writeFileSync(filename, JSON.stringify(existingData, null, 2), "utf8"),
    fs.writeFileSync(
      contractHoldersFilename,
      JSON.stringify(contractHolders, null, 2),
      "utf8"
    ),
    fs.writeFileSync(
      realmDiamondFilename,
      JSON.stringify(realmDiamondHolders, null, 2),
      "utf8"
    ),
    fs.writeFileSync(
      vaultFilename,
      JSON.stringify(vaultHolders, null, 2),
      "utf8"
    ),
    fs.writeFileSync(
      contractHolderEOAsFilename,
      JSON.stringify(contractEOAs, null, 2),
      "utf8"
    ),
  ];

  await Promise.all(writePromises);

  console.log(`Updated data for ${holders.length} holders in ${filename}`);
}

const main = async () => {
  await updateHolderData(
    CONTRACTS.installations,
    FILES.installations,
    FILES.installationsContracts,
    FILES.realmDiamondInstallations,
    FILES.vaultInstallations,
    FILES.installationsContractHolderEOAs
  );

  await updateHolderData(
    CONTRACTS.tiles,
    FILES.tiles,
    FILES.tilesContracts,
    FILES.realmDiamondTiles,
    FILES.vaultTiles,
    FILES.tilesContractHolderEOAs
  );
};

//a simple fn that gets the owner of an arbitrary contract
//if the call fails return a mild error
export const getOwner = async (contractAddress: string) => {
  const owner = await ethers.getContractAt(
    "contracts/interfaces/Ownable.sol:Ownable",
    contractAddress
  );
  try {
    const ownerAddress = await owner.owner();
    return ownerAddress;
  } catch (error) {
    console.log(`Error getting owner of ${contractAddress}: ${error}`);
    return "";
  }
};

main();

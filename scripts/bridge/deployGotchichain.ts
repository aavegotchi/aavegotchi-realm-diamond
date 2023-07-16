import { ethers } from "hardhat";

const {
  LZ_ENDPOINT_ADDRESS_GOTCHICHAIN: lzEndpointAddressGotchichain,
  INSTALLATION_GOTCHICHAIN_DIAMOND_ADDRESS: installationDiamondAddress,
  TILES_DIAMOND_GOTCHICHAIN_ADDRESS: tilesDiamondAddress,
} = process.env;

async function main() {
  await deployBridgeInstallations(installationDiamondAddress);
  await deployBridgeTiles(tilesDiamondAddress);
}

async function deployBridgeInstallations(installationDiamondAddress: string) {
  if (!lzEndpointAddressGotchichain) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }
  if (!installationDiamondAddress) {
    throw new Error("INSTALLATION_DIAMOND_ADDRESS env variable not set");
  }
  const BridgeGotchichainSide = await ethers.getContractFactory(
    "InstallationsBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    lzEndpointAddressGotchichain,
    installationDiamondAddress
  );
  await bridgeGotchichainSide.deployed();

  console.log(
    "InstallationsBridgeGotchichainSide deployed to:",
    bridgeGotchichainSide.address
  );
  return bridgeGotchichainSide;
}

async function deployBridgeTiles(tilesDiamondAddress: string) {
  if (!lzEndpointAddressGotchichain) {
    throw new Error("LZ_ENDPOINT_ADDRESS_GOTCHICHAIN env variable not set");
  }
  if (!tilesDiamondAddress) {
    throw new Error("TILES_DIAMOND_ADDRESS env variable not set");
  }
  const BridgeGotchichainSide = await ethers.getContractFactory(
    "TilesBridgeGotchichainSide"
  );

  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(
    lzEndpointAddressGotchichain,
    tilesDiamondAddress
  );
  await bridgeGotchichainSide.deployed();

  console.log(
    "TilesBridgeGotchichainSide deployed to:",
    bridgeGotchichainSide.address
  );
  return bridgeGotchichainSide;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { ethers } from "hardhat";

const {
  LZ_ENDPOINT_ADDRESS_MUMBAI: lzEndpointAddressPolygon,
  INSTALLATION_POLYGON_DIAMOND_ADDRESS: installationDiamondAddress,
  TILES_POLYGON_DIAMOND_ADDRESS: tilesDiamondAddress,
} = process.env;

async function main() {
  await deployBridgeInstallations(installationDiamondAddress);
  await deployBridgeTiles(tilesDiamondAddress);
}

async function deployBridgeInstallations(installationDiamondAddress: string) {
  if (!lzEndpointAddressPolygon) {
    throw new Error("LZ_ENDPOINT_ADDRESS_POLYGON env variable not set");
  }
  if (!installationDiamondAddress) {
    throw new Error("INSTALLATION_DIAMOND_ADDRESS env variable not set");
  }
  const BridgePolygonSide = await ethers.getContractFactory(
    "InstallationsBridgePolygonSide"
  );

  const bridgePolygonSide = await BridgePolygonSide.deploy(
    lzEndpointAddressPolygon,
    installationDiamondAddress
  );
  await bridgePolygonSide.deployed();

  console.log(
    "InstallationsBridgePolygonSide deployed to:",
    bridgePolygonSide.address
  );
  return bridgePolygonSide;
}

async function deployBridgeTiles(tilesDiamondAddress: string) {
  if (!lzEndpointAddressPolygon) {
    throw new Error("LZ_ENDPOINT_ADDRESS_POLYGON env variable not set");
  }
  if (!tilesDiamondAddress) {
    throw new Error("TILES_POLYGON_DIAMOND_ADDRESS env variable not set");
  }
  const BridgePolygonSide = await ethers.getContractFactory(
    "TilesBridgePolygonSide"
  );

  const bridgePolygonSide = await BridgePolygonSide.deploy(
    lzEndpointAddressPolygon,
    tilesDiamondAddress
  );
  await bridgePolygonSide.deployed();

  console.log(
    "TilesBridgePolygonSide deployed to:",
    bridgePolygonSide.address
  );
  return bridgePolygonSide;
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

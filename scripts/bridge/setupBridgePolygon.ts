import { ethers } from "hardhat";

const {
  INSTALLATION_POLYGON_BRIDGE_ADDRESS: installationPolygonBridgeAddress,
  INSTALLATION_GOTCHICHAIN_BRIDGE_ADDRESS: installationGotchichainBridgeAddress,
  TILES_POLYGON_BRIDGE_ADDRESS: tilesPolygonBridgeAddress,
  TILES_GOTCHICHAIN_BRIDGE_ADDRESS: tilesGotchichainBridgeAddress,
  LZ_CHAIN_ID_GOTCHICHAIN: lzChainIdGotchichain,
  TILES_DIAMOND_POLYGON_ADDRESS: tileDiamondPolygonAddress,
  INSTALLATION_DIAMOND_POLYGON_ADDRESS: installationDiamondPolygonAddress,
} = process.env;

// validate env variables
if (!lzChainIdGotchichain) {
  throw new Error("LZ_CHAIN_ID_MUMBAI env variable not set");
}
if (!installationGotchichainBridgeAddress) {
  throw new Error("INSTALLATION_GOTCHICHAIN_BRIDGE_ADDRESS env variable not set");
}
if (!tilesGotchichainBridgeAddress) {
  throw new Error("TILES_GOTCHICHAIN_BRIDGE_ADDRESS env variable not set");
}
if (!installationPolygonBridgeAddress) {
  throw new Error("INSTALLATION_POLYGON_BRIDGE_ADDRESS env variable not set");
}
if (!tilesPolygonBridgeAddress) {
  throw new Error("TILES_POLYGON_BRIDGE_ADDRESS env variable not set");
}

async function main() {
  await setupBridgeInstallations();
  await setupBridgeTiles();
}

async function setupBridgeTiles() {
  const bridgePolygonSide = await ethers.getContractAt(
    "TilesBridgePolygonSide",
    tilesPolygonBridgeAddress
  );

  const tileFacet = await ethers.getContractAt("TileFacet", tileDiamondPolygonAddress);

  console.log(`Setting trusted remote`);
  let tx = await bridgePolygonSide.setTrustedRemote(
    lzChainIdGotchichain,
    ethers.utils.solidityPack(
      ["address", "address"],
      [tilesGotchichainBridgeAddress, tilesPolygonBridgeAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgePolygonSide.setMinDstGas(lzChainIdGotchichain, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting use custom adapter params`);
  tx = await bridgePolygonSide.setUseCustomAdapterParams(true);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await tileFacet.setLayerZeroBridgeAddress(bridgePolygonSide.address);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
}

async function setupBridgeInstallations() {
  const bridgePolygonSide = await ethers.getContractAt(
    "InstallationsBridgePolygonSide",
    installationGotchichainBridgeAddress
  );

  const installationFacet = await ethers.getContractAt("InstallationFacet", installationDiamondPolygonAddress);

  console.log(`Setting trusted remote`);
  let tx = await bridgePolygonSide.setTrustedRemote(
    lzChainIdGotchichain,
    ethers.utils.solidityPack(
      ["address", "address"],
      [installationGotchichainBridgeAddress, installationPolygonBridgeAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgePolygonSide.setMinDstGas(lzChainIdGotchichain, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting use custom adapter params`);
  tx = await bridgePolygonSide.setUseCustomAdapterParams(true);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await installationFacet.setLayerZeroBridgeAddress(bridgePolygonSide.address);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
}

if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

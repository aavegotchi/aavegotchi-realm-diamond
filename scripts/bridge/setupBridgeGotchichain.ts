import { ethers } from "hardhat";

const {
  INSTALLATION_POLYGON_BRIDGE_ADDRESS: installationPolygonBridgeAddress,
  INSTALLATION_GOTCHICHAIN_BRIDGE_ADDRESS: installationGotchichainBridgeAddress,
  TILES_POLYGON_BRIDGE_ADDRESS: tilesPolygonBridgeAddress,
  TILES_GOTCHICHAIN_BRIDGE_ADDRESS: tilesGotchichainBridgeAddress,
  LZ_CHAIN_ID_MUMBAI: lzChainIdMumbai,
  TILES_DIAMOND_GOTCHICHAIN_ADDRESS: tileDiamondGotchichainAddress,
  INSTALLATION_DIAMOND_GOTCHICHAIN_ADDRESS: installationDiamondGotchichainAddress,
} = process.env;

// validate env variables
if (!lzChainIdMumbai) {
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
  const bridgeGotchichainSide = await ethers.getContractAt(
    "TilesBridgeGotchichainSide",
    tilesGotchichainBridgeAddress
  );

  const tileFacet = await ethers.getContractAt("TileFacet", tileDiamondGotchichainAddress);

  console.log(`Setting trusted remote`);
  let tx = await bridgeGotchichainSide.setTrustedRemote(
    lzChainIdMumbai,
    ethers.utils.solidityPack(
      ["address", "address"],
      [tilesPolygonBridgeAddress, tilesGotchichainBridgeAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdMumbai, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting use custom adapter params`);
  tx = await bridgeGotchichainSide.setUseCustomAdapterParams(true);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await tileFacet.setLayerZeroBridgeAddress(bridgeGotchichainSide.address);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();
}

async function setupBridgeInstallations() {
  const bridgeGotchichainSide = await ethers.getContractAt(
    "InstallationsBridgeGotchichainSide",
    installationGotchichainBridgeAddress
  );

  const installationFacet = await ethers.getContractAt("InstallationFacet", installationDiamondGotchichainAddress);

  console.log(`Setting trusted remote`);
  let tx = await bridgeGotchichainSide.setTrustedRemote(
    lzChainIdMumbai,
    ethers.utils.solidityPack(
      ["address", "address"],
      [installationPolygonBridgeAddress, installationGotchichainBridgeAddress]
    )
  );
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting min dst gas`);
  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdMumbai, 1, 35000);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting use custom adapter params`);
  tx = await bridgeGotchichainSide.setUseCustomAdapterParams(true);
  console.log(`tx hash: ${tx.hash}`);
  await tx.wait();

  console.log(`Setting layer zero bridge address`);
  tx = await installationFacet.setLayerZeroBridgeAddress(bridgeGotchichainSide.address);
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

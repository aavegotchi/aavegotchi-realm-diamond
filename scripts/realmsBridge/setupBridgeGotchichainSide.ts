/* global ethers hre */

import { ethers } from "hardhat";

const lzChainIdPolygon = process.env.LZ_CHAIN_ID_POLYGON as string
const realmsBridgeAddressPolygon = process.env.REALMS_BRIDGE_ADDRESS_POLYGON as string
const realmsBridgeAddressGotchichain = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

const txParams = {
  gasPrice: "5000000000"
}

export default async function main() {
  const bridgeGotchichainSide = await ethers.getContractAt("RealmsBridgeGotchichainSide", realmsBridgeAddressGotchichain)
  
  let tx = await bridgeGotchichainSide.setTrustedRemote(lzChainIdPolygon, ethers.utils.solidityPack(["address", "address"], [realmsBridgeAddressPolygon, bridgeGotchichainSide.address]), txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setDstChainIdToBatchLimit(lzChainIdPolygon, 1, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setMinDstGas(lzChainIdPolygon, 1, 4500000, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  tx = await bridgeGotchichainSide.setDstChainIdToTransferGas(lzChainIdPolygon, 1950000, txParams)
  console.log(`Waiting for tx to be validated, tx hash: ${tx.hash}`)
  await tx.wait()

  console.log("Bridge setted on Polygon.");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.deployProject = main;

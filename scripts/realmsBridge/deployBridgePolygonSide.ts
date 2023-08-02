/* global ethers hre */

import { ethers } from "hardhat";

const lzEndpointAddressPolygon = process.env.LZ_ENDPOINT_ADDRESS_POLYGON as string
const realmsDiamondAddressPolygon = process.env.REALMS_DIAMOND_ADDRESS_POLYGON as string

export default async function main() {
  const minGasToStore = 150000
  const BridgePolygonSide = await ethers.getContractFactory("RealmsBridgePolygonSide");
  const bridgePolygonSide = await BridgePolygonSide.deploy(minGasToStore, lzEndpointAddressPolygon, realmsDiamondAddressPolygon)

  console.log("RealmsBridgePolygonSide deployed to:", bridgePolygonSide.address);
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

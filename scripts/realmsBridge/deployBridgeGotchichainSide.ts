/* global ethers hre */

import { ethers } from "hardhat";
import addAllowlist from "../addToAllowList";

const lzEndpointAddressGotchichain = process.env.LZ_ENDPOINT_ADDRESS_GOTCHICHAIN as string
const realmsDiamondAddressGotchichain = process.env.REALMS_DIAMOND_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const minGasToStore = 50000
  const BridgeGotchichainSide = await ethers.getContractFactory("RealmsBridgeGotchichainSide");
  const bridgeGotchichainSide = await BridgeGotchichainSide.deploy(minGasToStore, lzEndpointAddressGotchichain, realmsDiamondAddressGotchichain)

  console.log("RealmsBridgeGotchichainSide deployed to:", bridgeGotchichainSide.address);

  await addAllowlist(bridgeGotchichainSide.address)
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

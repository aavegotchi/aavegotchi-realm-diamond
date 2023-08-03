/* global ethers hre */

import { ethers } from "hardhat";
import { RealmGettersAndSettersFacet, RealmsBridgeGotchichainSide } from "../../typechain-types";

const realmsDiamondAddress = process.env.REALMS_DIAMOND_ADDRESS_GOTCHICHAIN as string
const realmsBridgeAddress = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const realmGettersAndSettersFacet: RealmGettersAndSettersFacet = await ethers.getContractAt("RealmGettersAndSettersFacet", realmsDiamondAddress)
  const realmsBridge: RealmsBridgeGotchichainSide = await ethers.getContractAt("RealmsBridgeGotchichainSide", realmsBridgeAddress)

  const parcel = await realmGettersAndSettersFacet.getParcel('88')

  console.log(realmsBridgeAddress)
  console.log(parcel.owner)

  console.log(await realmsBridge.token())
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

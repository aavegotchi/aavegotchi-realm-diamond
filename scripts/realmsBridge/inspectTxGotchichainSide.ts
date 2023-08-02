/* global ethers hre */

import { ethers } from "hardhat";
import { RealmsBridgeGotchichainSide } from "../../typechain-types";

const realmsBridgeAddressGotchichain = process.env.REALMS_BRIDGE_ADDRESS_GOTCHICHAIN as string

export default async function main() {
  const realmsBridgeGotchichainSide: RealmsBridgeGotchichainSide = await ethers.getContractAt("RealmsBridgeGotchichainSide", realmsBridgeAddressGotchichain)

  const tx = await ethers.provider.getTransactionReceipt("0xf77700f7dfa0f1026d668e65d215cf6fe0b294f483a333126b73e4630923a056")
  console.log(tx.logs)

  console.log("events")
  const events = Object.keys(realmsBridgeGotchichainSide.interface.events)
  events.forEach((event) => {
    console.log(`${realmsBridgeGotchichainSide.interface.getEventTopic(event)} --- ${event}`)
  })
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

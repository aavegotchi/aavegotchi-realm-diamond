import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { VRFFacet } from "../../../typechain";

export async function setAddresses() {
  const c = await varsForNetwork(ethers);

  let vrfFacet = (await ethers.getContractAt(
    "VRFFacet",
    c.realmDiamond
  )) as VRFFacet;

  // console.log("subscribe");
  // const subTx = await vrfFacet.subscribe({
  //   gasPrice: 500000000000,
  // });

  // await subTx.wait();

  // console.log("topup");
  // const topTx = await vrfFacet.topUpSubscription(
  //   ethers.utils.parseUnits("0.1"),
  //   {
  //     gasPrice: 500000000000,
  //   }
  // );

  // await topTx.wait();

  console.log("Setting vrf");

  const requestConfig = {
    subId: 0,
    callbackGasLimit: 10000000,
    requestConfirmations: 3,
    numWords: 4,
    keyHash:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
  };

  let tx = await vrfFacet.setConfig(
    requestConfig,
    "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
    {
      gasPrice: 500000000000,
    }
  );

  await tx.wait();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setAddresses()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

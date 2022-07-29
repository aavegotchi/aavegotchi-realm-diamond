import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { VRFFacet } from "../../../typechain";

export async function setVRF() {
  const c = await varsForNetwork(ethers);

  console.log("c:", c);

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

  let requestConfig;
  let tx;

  if (network.name === "mumbai") {
    requestConfig = {
      subId: 900,
      callbackGasLimit: 500_000,
      requestConfirmations: 10,
      numWords: 4,
      keyHash:
        "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    };

    tx = await vrfFacet.setConfig(
      requestConfig,
      "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
      {
        gasPrice: 50000000000,
      }
    );

    //matic mainnet
  } else {
    requestConfig = {
      subId: 114,
      callbackGasLimit: 500_000,
      requestConfirmations: 32,
      numWords: 4,
      keyHash:
        "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
    };

    tx = await vrfFacet.setConfig(
      requestConfig,
      "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
      {
        gasPrice: 50000000000,
      }
    );
  }

  await tx.wait();

  console.log("VRF Config updated!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  setVRF()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

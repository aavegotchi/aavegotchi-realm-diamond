import { Signer } from "ethers";
import { BigNumberish } from "@ethersproject/bignumber";
import { ethers, network } from "hardhat";
import { VRFFacet, OwnershipFacet } from "../../../typechain";
import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  maticDiamondAddress,
  pixelcraftAddress,
  gasPrice,
} from "../../helperFunctions";
import { alchemicaTotals, boostMultipliers } from "../../setVars";

export async function setAddresses() {
  const diamondAddress = "0x9351e6705590756BAc83f591aDE9f61De5998a84";

  let vrfFacet = (await ethers.getContractAt(
    "VRFFacet",
    diamondAddress
  )) as VRFFacet;

  console.log("subscribe");
  const subTx = await vrfFacet.subscribe({
    gasPrice: 500000000000,
  });

  await subTx.wait();

  console.log("topup");
  const topTx = await vrfFacet.topUpSubscription(
    ethers.utils.parseUnits("0.1"),
    {
      gasPrice: 500000000000,
    }
  );

  await topTx.wait();

  console.log("Setting vrf");

  const requestConfig = {
    subId: 0,
    callbackGasLimit: 2000000,
    requestConfirmations: 3,
    numWords: 4,
    keyHash:
      "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
  };

  let tx = await vrfFacet.setConfig(requestConfig, {
    gasPrice: 500000000000,
  });

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

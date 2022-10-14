import { ethers, network } from "hardhat";
import { alchemica, varsForNetwork } from "../../../constants";
import { AlchemicaFacet, VRFFacet } from "../../../typechain";
import { impersonate } from "../../helperFunctions";
import { genClaimAlchemicaSignature } from "../realmHelpers";
import { upgradeRemaining } from "../upgrades/upgrade-remainingAlchemica";

export async function setAddresses() {
  const c = await varsForNetwork(ethers);

  const owner = "0x26bac3547908e923b641c186000585e8ce98f4db";

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond
  )) as AlchemicaFacet;

  await upgradeRemaining();

  alchemicaFacet = await impersonate(owner, alchemicaFacet, ethers, network);

  const lastClaimed = await alchemicaFacet.lastClaimedAlchemica("10439");
  const sig = await genClaimAlchemicaSignature(10439, 0, lastClaimed);

  const alpha = await ethers.getContractAt("ERC20", c.alpha);

  const balance = await alpha.balanceOf(owner);
  console.log("balance before:", balance.toString());

  const available = await alchemicaFacet.getAvailableAlchemica(10439);
  console.log("available:", available[2].toString());

  const tx = await alchemicaFacet.claimAvailableAlchemica("10439", "0", sig);

  const balanceAfter = await alpha.balanceOf(owner);
  console.log("balance after:", balanceAfter.toString());

  const available2 = await alchemicaFacet.getAvailableAlchemica("391");

  console.log("available:", available2);

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

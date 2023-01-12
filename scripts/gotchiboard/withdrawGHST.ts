import * as hre from "hardhat";

import { ethers } from "hardhat";
import { maticVars } from "../../constants";
import { generateLeaderboard } from "./generateLeaderboard";

const { LedgerSigner } = require("@ethersproject/hardware-wallets");

async function main() {
  const owner = "0x26bac3547908e923b641c186000585e8ce98f4db";
  let signer;
  const testing = ["hardhat", "localhost"].includes(hre.network.name);

  if (testing) {
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [owner],
    });
    signer = await hre.ethers.getSigner(owner);
  } else if (hre.network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "hid", "m/44'/60'/2'/0/0");
  } else {
    throw Error("Incorrect network selected");
  }

  const alchemicaFacet = await ethers.getContractAt(
    "AlchemicaFacet",
    maticVars.realmDiamond,
    signer
  );

  // get Leaderboard with ghst to withdraw
  // set time from and interval
  let timeFrom = 1672617600;
  let interval = "week";
  const leaderboard = await generateLeaderboard(timeFrom, interval);
  let winners = leaderboard.filter((e) => e.ghstReward > 0);
  if (winners.length == 0) {
    return;
  }

  let allTokens = winners.map((e) => [maticVars.ghst]);
  let allAmounts = winners.map((e) => [
    ethers.utils.parseUnits(e.ghstReward.toString(), 18),
  ]);
  let allAddresses = winners.map((e) => e.account);

  const tx = await alchemicaFacet.batchTransferTokens(
    allTokens,
    allAmounts,
    allAddresses
  );

  let receipt = await tx.wait();
  console.log("Gas used:", receipt.gasUsed);
  if (!receipt.status) {
    throw Error(`Error:: ${tx.hash}`);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

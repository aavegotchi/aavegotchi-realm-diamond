import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network } from "hardhat";
import { alchemica, gasPrice, varsForNetwork } from "../../../constants";
import { AlchemicaFacet, VRFFacet } from "../../../typechain";
import { diamondOwner, impersonate } from "../../helperFunctions";
import { genClaimAlchemicaSignature } from "../realmHelpers";
import { upgradeRemaining } from "../upgrades/upgrade-remainingAlchemica";

export async function incrementRound() {
  const c = await varsForNetwork(ethers);

  const owner = await diamondOwner(c.realmDiamond, ethers);
  console.log("onwer:", owner);

  let alchemicaFacet = (await ethers.getContractAt(
    "AlchemicaFacet",
    c.realmDiamond,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as AlchemicaFacet;

  if (network.name === "hardhat") {
    alchemicaFacet = await impersonate(
      await diamondOwner(c.realmDiamond, ethers),
      alchemicaFacet,
      ethers,
      network
    );
  }

  const tx = await alchemicaFacet.progressSurveyingRound({
    gasPrice: gasPrice,
  });

  await tx.wait();
  console.log("Round increased!");
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  incrementRound()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

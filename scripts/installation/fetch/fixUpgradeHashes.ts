import { ethers, network } from "hardhat";
import { InstallationAdminFacet } from "../../../typechain/InstallationAdminFacet";

import { diamondOwner, impersonate } from "../helperFunctions";
import { gasPrice, varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
import { upgrade } from "../upgrades/upgrade-deleteHashes";
import { getRelayerSigner } from "../../helperFunctions";
const inputjson = require("./finalizedHashes.json");

export async function fixUpgrades() {
  await upgrade();
  const c = await varsForNetwork(ethers);

  //let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  let signer = getRelayerSigner();

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (["hardhat", "localhost"].includes(network.name)) {
    installationFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      installationFacet,
      ethers,
      network
    );
  }
  const batchSize = 900;
  for (let i = 0; i < inputjson.length; i += batchSize) {
    const batch = inputjson.slice(i, i + batchSize);

    console.log("running batch", i / batchSize);
    try {
      const tx = await installationFacet.deleteBuggedUpgradesWithHashes(batch, {
        gasPrice: gasPrice,
      });
      await tx.wait();

      console.log("successfully executed batch", i / batchSize);
    } catch (error) {
      console.log(error);
      console.log("error occured at batch", i / batchSize);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
//getUpgrades();
if (require.main === module) {
  fixUpgrades()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { ethers, network } from "hardhat";
import { InstallationAdminFacet } from "../../../typechain/InstallationAdminFacet";

import { impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { getRelayerSigner } from "../../helperFunctions";
const inputjson = require("./finalizedHashes.json");

export async function fixUpgrades() {
  // await upgrade();
  const c = await varsForNetwork(ethers);

  let signer = getRelayerSigner();

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  console.log("relayer:", c.defenderRelayer);

  if (["hardhat", "localhost"].includes(network.name)) {
    installationFacet = await impersonate(
      c.defenderRelayer,
      installationFacet,
      ethers,
      network
    );
  }

  console.log("number of events:", inputjson.length);

  const batchSize = 900;
  for (let i = 0; i < inputjson.length; i += batchSize) {
    const batch = inputjson.slice(i, i + batchSize);

    console.log("running batch", i / batchSize);
    try {
      await installationFacet.deleteBuggedUpgradesWithHashes(batch);
      // await tx.wait();

      console.log("successfully relayed batch", i / batchSize);
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

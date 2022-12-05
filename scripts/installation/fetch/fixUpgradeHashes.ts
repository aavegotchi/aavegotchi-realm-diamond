import { ethers, network } from "hardhat";
import { InstallationAdminFacet } from "../../../typechain";

import { diamondOwner, impersonate } from "../helperFunctions";
import { varsForNetwork } from "../../../constants";
import { LedgerSigner } from "@anders-t/ethers-ledger";
const inputData = require("./finalizedCleanedEvents.json");
const inputjson = require("./finalizedHashes.json");
import { upgrade } from "../upgrades/upgrade-deleteHashes";

// function getUpgrades() {
//   const hashFile = "scripts/installation/fetch/finalizedHashes.json";
//   // output array to hold calculated hashes
//   const output = [];

//   // calculate hash for each element in the input array
//   inputData.forEach((data) => {
//     const hash = ethers.utils.solidityKeccak256(
//       ["uint256", "uint256", "uint256", "uint256"],
//       [data.parcel.id, data.x, data.y, data.installation.id]
//     );

//     // add calculated hash to the output array
//     output.push(hash);
//   });

//   // write the output array to an output file
//   const fs = require("fs");
//   fs.writeFileSync(hashFile, JSON.stringify(output, null, 2));
// }

export async function fixUpgrades() {
  await upgrade();
  const c = await varsForNetwork(ethers);

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let installationFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "localhost") {
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
    try {
      await installationFacet["deleteBuggedUpgrades(bytes32[])"](batch);
      console.log("successfully executed batch", i / batchSize);
    } catch (error) {
      console.log("error occured at batch", i / batchSize);
    }
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

if (require.main === module) {
  fixUpgrades()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

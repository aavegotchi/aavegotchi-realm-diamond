import { ethers } from "hardhat";

const inputData = require("./rogueEvents.json");

function getUpgrades() {
  const hashFile = "scripts/installation/fetch/rogueHashes.json";
  // output array to hold calculated hashes
  const output = [];

  // calculate hash for each element in the input array
  inputData.forEach((data) => {
    const hash = ethers.utils.solidityKeccak256(
      ["uint256", "uint16", "uint16", "uint256"],
      [data.parcel.id, data.x, data.y, data.installation.id]
    );

    // add calculated hash to the output array
    output.push(hash);
  });

  // write the output array to an output file
  const fs = require("fs");
  fs.writeFileSync(hashFile, JSON.stringify(output, null, 2));
}

getUpgrades();

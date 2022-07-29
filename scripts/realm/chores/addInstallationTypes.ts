//@ts-ignore
import { ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  InstallationAdminFacet,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";
import { installationTypes } from "../../../data/installations/graandFountain";
import { outputInstallation } from "../realmHelpers";
import { LedgerSigner } from "@anders-t/ethers-ledger";

const gasPrice = 90000000000;

async function addInstallations() {
  const accounts = await ethers.getSigners();

  const c = await varsForNetwork(ethers);

  console.log("diamond address:", c.installationDiamond);

  //transfer ownership to multisig
  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    c.installationDiamond
  )) as OwnershipFacet;

  let currentOwner = await ownershipFacet.owner();

  console.log("Current owner is:", currentOwner);
  let signer: any;

  const testing = ["hardhat", "localhost"].includes(network.name);

  if (testing) {
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (network.name === "matic") {
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
  } else if (network.name === "mumbai") {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond,
    signer
  )) as InstallationFacet;

  const toAdd = [outputInstallation(installationTypes[0])];

  console.log("to add:", toAdd);

  const tx = await installationAdminFacet.addInstallationTypes(toAdd, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  console.log("Installations have been added!");

  const types = await installationFacet.getInstallationTypes([]);

  types.forEach((element) => {
    console.log("el:", element);
  });

  // console.log("types:", types);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  addInstallations()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

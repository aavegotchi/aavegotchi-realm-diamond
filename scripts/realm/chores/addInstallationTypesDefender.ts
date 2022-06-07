//@ts-ignore
import hardhat, { run, ethers, network } from "hardhat";
import {
  InstallationAdminFacet,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";
import { InstallationTypeInput } from "../../../types";
import { installationDiamondAddress } from "../../helperFunctions";
import { goldenAaltar, testInstallations } from "../realmHelpers";
import {
  DefenderRelaySigner,
  DefenderRelayProvider,
} from "defender-relay-client/lib/ethers";

const credentials = {
  apiKey: process.env.DEFENDER_API_KEY_MUMBAI,
  apiSecret: process.env.DEFENDER_SECRET_KEY_MUMBAI,
};
const provider = new DefenderRelayProvider(credentials);
const signer = new DefenderRelaySigner(credentials, provider, {
  speed: "fastest",
});

const gasPrice = 900000000000;

async function addInstallations() {
  const accounts = await ethers.getSigners();

  const diamondAddress = "0x4900274742fFA08a458466b9560600F97bbA410C";

  console.log("diamond address:", diamondAddress);

  //transfer ownership to multisig
  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;

  let currentOwner = await ownershipFacet.owner();

  console.log("Current owner is:", currentOwner);

  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress,
    signer
  )) as InstallationAdminFacet;

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress,
    signer
  )) as InstallationFacet;

  const tx = await installationAdminFacet.addInstallationTypes(goldenAaltar());
  await tx.wait();

  console.log("Installations have been added!");

  const types = await installationFacet.getInstallationType(0);

  console.log("types:", types);
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

//@ts-ignore
import hardhat, { run, ethers, network } from "hardhat";
import { InstallationFacet, OwnershipFacet } from "../../../typechain";
import { InstallationTypeInput } from "../../../types";
import { installationDiamondAddress } from "../../helperFunctions";
import { goldenAaltar, testInstallations } from "../realmHelpers";

const gasPrice = 20000000000;

async function addInstallations() {
  const accounts = await ethers.getSigners();

  const diamondAddress = installationDiamondAddress(network.name);

  console.log("diamond address:", diamondAddress);

  //transfer ownership to multisig
  const ownershipFacet = (await ethers.getContractAt(
    "OwnershipFacet",
    diamondAddress
  )) as OwnershipFacet;

  let currentOwner = await ownershipFacet.owner();

  console.log("Current owner is:", currentOwner);
  let signer: any;

  const testing = ["hardhat", "localhost"].includes(hardhat.network.name);

  if (testing) {
    await hardhat.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [currentOwner],
    });
    signer = await ethers.provider.getSigner(currentOwner);
  } else if (
    hardhat.network.name === "matic" ||
    hardhat.network.name === "mumbai"
  ) {
    signer = accounts[0];
  } else {
    throw Error("Incorrect network selected");
  }

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress,
    signer
  )) as InstallationFacet;

  const tx = await installationFacet.addInstallationTypes(goldenAaltar(), {
    gasPrice: gasPrice,
  });
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

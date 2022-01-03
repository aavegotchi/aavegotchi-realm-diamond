import { ethers } from "hardhat";
import { InstallationFacet } from "../../typechain";

export async function setAddresses() {
  const diamondAddress = "0x071f9431276F63aaA14b759Bd41143Cb1654AB93";
  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress
  )) as InstallationFacet;

  await installationFacet.craftInstallations([1]);
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

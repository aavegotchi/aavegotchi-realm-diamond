import { ethers } from "hardhat";
import { InstallationFacet } from "../../typechain";

export async function setAddresses() {
  const diamondAddress = "0xe927518d25ef44EA33b12AFF524AC236e064C35c";
  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress
  )) as InstallationFacet;

  await installationFacet.setAlchemicaAddresses(
    [
      "0xb70fb5e238a84C939e26985926B4CF0Dc8450AA4",
      "0x95d36E62F5F2Eb8bA96664FFC5b9CF469C53e26E",
      "0xe1FFaBb85FaB1F05574a3af824312022886A524f",
      "0xDD3218f01b2b9ee1b10C2F18F06b4c6226F86E43",
    ],
    { gasPrice: ethers.utils.parseUnits("200", "gwei") }
  );

  await installationFacet.setAddresses(
    "0x705F32B7D678eE71085ed11ddcba7378367f1582",
    "0xbb5Ded610965118240EeE51d65f57BFFa4a7Fcdd",
    "0x0000000000000000000000000000000000000000",
    { gasPrice: ethers.utils.parseUnits("200", "gwei") }
  );
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

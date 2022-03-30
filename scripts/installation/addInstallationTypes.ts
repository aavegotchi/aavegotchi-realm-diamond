import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { installationTypes } from "../../data/installations/installationTypes";
import { InstallationAdminFacet, InstallationFacet } from "../../typechain";
import { InstallationTypeInput, InstallationTypeOutput } from "../../types";

function outputInstallation(
  installation: InstallationTypeInput
): InstallationTypeOutput {
  if (installation.width > 64) throw new Error("Width too much");
  if (installation.height > 64) throw new Error("Height too much");

  const alchemica = installation.alchemicaCost.map((val) =>
    ethers.utils.parseEther(val.toString())
  );

  let output: InstallationTypeOutput = {
    deprecated: installation.deprecated,
    installationType: installation.installationType,
    level: installation.level,
    width: installation.width,
    height: installation.height,
    alchemicaType: installation.alchemicaType,
    alchemicaCost: [
      BigNumber.from(alchemica[0]),
      BigNumber.from(alchemica[1]),
      BigNumber.from(alchemica[2]),
      BigNumber.from(alchemica[3]),
    ],
    harvestRate: ethers.utils.parseEther(installation.harvestRate.toString()),
    capacity: ethers.utils.parseEther(installation.capacity.toString()),
    spillRadius: ethers.utils.parseEther(installation.spillRadius.toString()),
    spillRate: ethers.utils.parseEther(installation.spillRate.toString()),
    upgradeQueueBoost: installation.upgradeQueueBoost,
    craftTime: installation.craftTime,
    nextLevelId: installation.nextLevelId,
    prerequisites: installation.prerequisites,
    name: installation.name,
  };

  return output;
}

export async function setAddresses() {
  const diamondAddress = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";
  const installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    diamondAddress
  )) as InstallationAdminFacet;

  const installationFacet = (await ethers.getContractAt(
    "InstallationFacet",
    diamondAddress
  )) as InstallationFacet;

  const goldenAaltar = installationTypes.map((val) => outputInstallation(val));

  await installationAdminFacet.addInstallationTypes(goldenAaltar);

  const installations = await installationFacet.getInstallationTypes([]);

  console.log("instsllations:", installations);
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

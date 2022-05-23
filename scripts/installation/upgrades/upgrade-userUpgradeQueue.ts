import { run, ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../helperFunctions";

export async function upgrade() {
  const upgradeQueue =
    "tuple(address owner, uint16 coordinateX, uint16 coordinateY, uint40 readyBlock, bool claimed, uint256 parcelId, uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [],
      removeSelectors: [
        "function reduceUpgradeTime(uint256 _queueId, uint40 _amount) external",
        `function upgradeInstallation(${upgradeQueue} calldata _upgradeQueue, uint40 _gltr, bytes memory _signature) external`,
      ],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        "function finalizeUserUpgrades(address _owner) external",
        `function upgradeInstallation(${upgradeQueue} calldata _upgradeQueue,uint40 _gltr,bytes memory signature) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(
      maticInstallationDiamondAddress,
      ethers
    ),
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

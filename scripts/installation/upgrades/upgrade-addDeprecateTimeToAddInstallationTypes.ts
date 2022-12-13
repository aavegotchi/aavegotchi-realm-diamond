import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { upgradeDiamondCut } from "../../realm/upgrades/upgrade-diamond";
const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

export async function upgrade() {
  const vars = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        "function addInstallationTypes((uint8 width,uint8 height,uint16 installationType,uint8 level,uint8 alchemicaType,uint32 spillRadius,uint16 spillRate,uint8 upgradeQueueBoost,uint32 craftTime,uint32 nextLevelId,bool deprecated,uint256[4] alchemicaCost,uint256 harvestRate,uint256 capacity,uint256[] prerequisites,string name,uint256 unequipType,uint256 deprecateTime)[] calldata _installationTypes) external",
        `function deleteBuggedUpgrades(uint256 _parcelId, uint256 _coordinateX,uint256 _coordinateY, uint256 _installationId, uint256 _upgradeIndex) external`,
      ],
      removeSelectors: [
        "function addInstallationTypes((uint8 width,uint8 height,uint16 installationType,uint8 level,uint8 alchemicaType,uint32 spillRadius,uint16 spillRate,uint8 upgradeQueueBoost,uint32 craftTime,uint32 nextLevelId,bool deprecated,uint256[4] alchemicaCost,uint256 harvestRate,uint256 capacity,uint256[] prerequisites,string name,uint256 unequipType)[] calldata _installationTypes) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: vars.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
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

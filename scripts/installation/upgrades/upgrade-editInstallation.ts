import { run, ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { editInstallationTypes as updateAltars } from "../updates/editAltars";
import { editInstallationTypes as updateGoldenAltars } from "../updates/editGoldenAltars";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const InstallationType =
    "tuple(uint8 width, uint8 height, uint16 installationType, uint8 level, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function editInstallationTypes(uint256[] calldata _ids, ${InstallationType}[] calldata _installationTypes) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);

  await updateGoldenAltars();
  console.log("gogogo");
  await updateAltars();
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

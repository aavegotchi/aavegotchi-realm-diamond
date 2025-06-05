import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        "function instantUpgrade((uint16 coordinateX, uint16 coordinateY, uint256[] targetInstallationIds, uint256 parcelId, address realmDiamond) memory _params, uint256 _gltr, uint256 _gotchiId, bytes memory _signature) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: c.installationDiamond,
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

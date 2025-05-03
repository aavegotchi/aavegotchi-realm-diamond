import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { InstallationAdminFacet__factory } from "../../../typechain-types";
import { InstallationAdminFacetInterface } from "../../../typechain-types/contracts/InstallationDiamond/facets/InstallationAdminFacet";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: ["function toggleUpgradePaused(bool)"],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  let iface: InstallationAdminFacetInterface = new ethers.utils.Interface(
    InstallationAdminFacet__factory.abi
  ) as InstallationAdminFacetInterface;

  const calldata = iface.encodeFunctionData("toggleUpgradePaused", [true]);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: c.installationDiamond,
    initCalldata: calldata,
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

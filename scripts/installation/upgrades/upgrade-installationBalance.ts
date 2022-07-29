import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet,
  InstallationAdminFacet__factory,
  InstallationFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";
import { InstallationAdminFacetInterface } from "../../../typechain/InstallationAdminFacet";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

export async function upgradeInstallation() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    // initAddress: c.installationDiamond,
    // initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeInstallation()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

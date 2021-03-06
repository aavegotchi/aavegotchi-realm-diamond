import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { OwnershipFacet } from "../../../typechain";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        "function batchCraftInstallations((uint16 installationID,uint16 amount,uint40 gltr)[] calldata _inputs) external",
      ],
      removeSelectors: [],
    },
  ];

  //Adding batchCraftTile to TIleDiamond
  const facets2: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        "function batchCraftTiles((uint16 tileID,uint16 amount,uint40 gltr)[] calldata _inputs) external",
      ],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    c.installationDiamond
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);
  const joined2 = convertFacetAndSelectorsToString(facets2);
  const args1: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.tileDiamond,
    facetsAndAddSelectors: joined2,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args1); //upgrades to installation diamond
  await run("deployUpgrade", args2); //upgrades to tile diamond
  //await resetChain(ethers);
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

import { ethers, run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { RealmFacet } from "../../typechain";

export async function upgrade() {
  const realmDiamondAddress = "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11";
  const realmDiamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function fixAltarLevel(uint256[] memory _parcelIds) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: realmDiamondUpgrader,
    diamondAddress: realmDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: true,
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

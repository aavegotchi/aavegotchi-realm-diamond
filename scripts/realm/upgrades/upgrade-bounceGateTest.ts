import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { OwnershipFacet } from "../../../typechain";

let ownershipFacet: OwnershipFacet;
export async function upgradeBounceGateTest() {
  const c = await varsForNetwork(ethers);
  ownershipFacet = await ethers.getContractAt(
    "OwnershipFacet",
    "0x726F201A9aB38cD56D60ee392165F1434C4F193D"
  );
  const diamondUpgrader = await ownershipFacet.owner();

  //this upgrade removes the need for bouncegate equip checks and disables gltr transfers
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "BounceGateFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: "0x726F201A9aB38cD56D60ee392165F1434C4F193D",
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeBounceGateTest()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

import { RealmFacet__factory } from "../../../typechain-types";
import { RealmFacetInterface } from "../../../typechain-types/contracts/RealmDiamond/facets/RealmFacet";

export async function upgradeRealmTest() {
  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function setDiamondAddress(address _newDiamondAddress) external",
      ],

      removeSelectors: [],
    },
  ];

  let iface: RealmFacetInterface = new ethers.utils.Interface(
    RealmFacet__factory.abi
  ) as RealmFacetInterface;

  const calldata = iface.encodeFunctionData("setDiamondAddress", [
    c.aavegotchiDiamond,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: c.realmDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeRealmTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { RealmGettersAndSettersFacet } from "../../../typechain-types";

export async function upgradeRealmParcelGetter() {
  const c = await varsForNetwork(ethers);

  const realmFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmGettersAndSettersFacet",
      addSelectors: [
        "function getParcelsAccessRightsWhitelistIds(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view",
        "function getParcels(uint256[] calldata _parcelIds) external view",
      ],
      removeSelectors: [],
    },
  ];

  const realmJoined = convertFacetAndSelectorsToString(realmFacets);

  console.log("realm diamond:", c.realmDiamond);

  const realmArgs: DeployUpgradeTaskArgs = {
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: realmJoined,
    useLedger: false,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };
  
  await run("deployUpgrade", realmArgs);

  // const realmGettersAndSettersFacet = (await ethers.getContractAt(
  //     "RealmGettersAndSettersFacet",
  //     c.realmDiamond
  //   )) as RealmGettersAndSettersFacet;
  // const testParcels = await realmGettersAndSettersFacet.getParcels([10]);
  // console.log(testParcels)
}

if (require.main === module) {
  upgradeRealmParcelGetter()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

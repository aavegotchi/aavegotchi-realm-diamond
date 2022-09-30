import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "BounceGateFacet",
      addSelectors: [
        "function createEvent(string calldata _title, uint64 _startTime,uint64 _durationInMinutes,uint256[4] calldata _alchemicaSpent,uint256 _realmId) external",
        "function updateEvent(uint256 _realmId,uint256[4] calldata _alchemicaSpent,uint40 _durationExtensionInMinutes) external",
        "function viewEvent(uint256 _realmId) public",
        `function cancelEvent(uint256 _realmId) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    // //for testing only
    // {
    //   facetName: "SetPubKeyFacet",
    //   addSelectors: ["function setPubKey(bytes memory _newPubKey) external"],
    //   removeSelectors: [],
    // },
  ];

  const c = await varsForNetwork(ethers);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
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

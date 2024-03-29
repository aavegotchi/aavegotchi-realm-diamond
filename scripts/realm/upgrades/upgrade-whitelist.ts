import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgradeRealm() {
  const c = await varsForNetwork(ethers);

  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmGettersAndSettersFacet",
      addSelectors: [
        `function setParcelsAccessRightWithWhitelists(uint256[] calldata _realmIds,uint256[] calldata _actionRights,uint256[] calldata _accessRights,uint32[] _whitelistIds) external`,
      ],
      removeSelectors: [
        `function setParcelsWhitelists(uint256[] calldata _realmIds, uint256[] calldata _actionRights, uint32[] calldata _whitelistIds) external`,
        `function getParcelsAccessRightsWhitelistIds(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view returns (uint256[] memory output_)`,
      ],
    },
    // {
    //   facetName: "AlchemicaFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
    // ,
    // {
    //   facetName: "RealmFacet",
    //   addSelectors: [],
    //   removeSelectors: [],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeRealm()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

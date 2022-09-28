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
        `function setParcelsWhitelists(uint256[] calldata _realmIds, uint256[] calldata _actionRights, uint256[] calldata _whitelistIds) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "WhitelistFacet",
      addSelectors: [
        "function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external",
        "function updateWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external",
        "function removeAddressesFromWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external",
        "function transferOwnershipOfWhitelist(uint256 _whitelistId, address _whitelistOwner) external",
        "function whitelistExists(uint256 whitelistId) external view",
        "function isWhitelisted(uint256 _whitelistId, address _whitelistAddress) external view",
        "function getWhitelistsLength() external view",
        "function getWhitelist(uint256 _whitelistId) external view",
        "function whitelistOwner(uint256 _whitelistId) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    ,
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
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

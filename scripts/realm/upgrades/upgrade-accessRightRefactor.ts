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
      facetName: "RealmFacet",
      addSelectors: [
        `function equipInstallation(uint256 _realmId, uint256 _gotchiId, uint256 _installatßionId, uint256 _x, uint256 _y, bytes memory _signature) external`,
        `function equipTile(uint256 _realmId,uint256 _gotchiId,uint256 _tileId, uint256 _x,uint256 _y,bytes memory _signature) external`,
        `function unequipInstallation(uint256 _realmId, uint256 _gotchiId, uint256 _installationId,uint256 _x, uint256 _y, bytes memory _signature) external`,
        `function unequipTile(uint256 _realmId, uint256 _gotchiId, uint256 _tileId, uint256 _x, uint256 _y, bytes memory _signature) external`,
      ],
      removeSelectors: [
        `function equipInstallation(uint256 _realmId, uint256 _installatßionId, uint256 _x, uint256 _y, bytes memory _signature) external`,
        `function equipTile(uint256 _realmId, uint256 _tileId, uint256 _x,uint256 _y,bytes memory _signature) external`,
        `function unequipInstallation(uint256 _realmId, uint256 _installationId,uint256 _x, uint256 _y, bytes memory _signature) external`,
        `function unequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y, bytes memory _signature) external`,
      ],
    },
    {
      facetName: "AlchemicaFacet",
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

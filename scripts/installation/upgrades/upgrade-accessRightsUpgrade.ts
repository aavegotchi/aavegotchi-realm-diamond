import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner } from "../helperFunctions";

export async function upgradeInstallation() {
  const UpgradeQueue =
    "tuple(address owner,uint16 coordinateX, uint16 coordinateY,uint40 readyBlock,bool claimed,uint256 parcelId,uint256 installationId)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        `function upgradeInstallation(${UpgradeQueue} memory _upgradeQueue,uint256 _gotchiId,bytes memory _signature,uint40 _gltr) external`,
      ],
      removeSelectors: [
        `function upgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
      ],
    },
  ];

  //Realm Upgrade
  const facets2: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "RealmGettersAndSettersFacet",
      addSelectors: [
        `function verifyAccessRight(uint256 _realmId,uint256 _gotchiId,uint256 _actionRight, address _sender ) external view`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);
  const joined2 = convertFacetAndSelectorsToString(facets2);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.installationDiamond, ethers),
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };
  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(c.realmDiamond, ethers),
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined2,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);
  await run("deployUpgrade", args2);
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

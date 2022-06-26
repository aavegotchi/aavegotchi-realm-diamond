import { run } from "hardhat";
import { mumbaiRealmDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const upgradeQueue =
    "tuple(address owner, uint16 coordinateX, uint16 coordinateY, uint40 readyBlock, bool claimed, uint256 parcelId, uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        `function upgradeInstallation(${upgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
        `function finalizeUpgrades(uint256[] memory _upgradeIndexes) public`,
        `function getAllUpgradeQueue() external view`,
        `function getUserUpgradeQueue(address _owner) external view`,
        `function getUserUpgradeQueueNew(address _owner) external view`,
        `function getUpgradeQueueId(uint256 _queueId) external view`,
        `function getParcelUpgradeQueue(uint256 _parcelId) external view`,
        `function getUpgradeQueueLength() external view`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: mumbaiRealmDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
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

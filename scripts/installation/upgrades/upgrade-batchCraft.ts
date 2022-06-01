import { run, ethers } from "hardhat";
import {
  maticInstallationDiamondAddress,
  maticTileDiamondAddress,
} from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { InstallationUpgradeFacet, OwnershipFacet } from "../../../typechain";
import { getSelectors, resetChain } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const UpgradeQueue =
    "(address owner,uint16 coordinateX, uint16 coordinateY,uint40 readyBlock,bool claimed,uint256 parcelId,uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        "function batchCraftInstallations(uint16[] calldata _installationTypes,uint16[] calldata _amounts, uint40[] calldata _gltr) external",
      ],
      removeSelectors: [
        "function getUserUpgradeQueue(address _owner) external view",
        "function getAllUpgradeQueue() external view",
        "function getUpgradeQueueId(uint256 _queueId) external view",
      ],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [],
      removeSelectors: [
        `function upgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
        "function finalizeUpgrades(uint256[] memory _upgradeIndexes) public",
      ],
    },
    {
      facetName: "InstallationUpgradeFacet",
      //populate the new installationUpgrade facer
      addSelectors: [
        `function upgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
        "function finalizeUpgrades(uint256[] memory _upgradeIndexes) public",
        "function getUserUpgradeQueue(address _owner) external view",
        "function getAllUpgradeQueue() external view",
        "function getUpgradeQueueId(uint256 _queueId) external view",
      ],
      removeSelectors: [],
    },
  ];

  //Adding batchCraftTile to TIleDiamond
  const facets2: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        "function batchCraftTiles(uint16[] calldata _tileTypes, uint16[] calldata _amounts) external",
      ],
      removeSelectors: [],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    maticInstallationDiamondAddress
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);
  const joined2 = convertFacetAndSelectorsToString(facets2);
  const args1: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  const args2: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticTileDiamondAddress,
    facetsAndAddSelectors: joined2,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args1); //upgrades to installation diamond
  await run("deployUpgrade", args2); //upgrades to tile diamond
  //await resetChain(ethers);
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

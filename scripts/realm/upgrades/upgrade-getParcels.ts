import { run, ethers } from "hardhat";
//import { maticTileDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { OwnershipFacet } from "../../../typechain-types";
import { varsForNetwork } from "../../../constants";

export async function upgrade() {
  const c = await varsForNetwork(ethers);

  const pTuple =
    "tuple(" +
    "address owner," +
    "string parcelAddress," +
    "string parcelId," +
    "uint256 coordinateX," +
    "uint256 coordinateY," +
    "uint256 district," +
    "uint256 size," +
    "uint256[4] alchemicaBoost," +
    "uint256[4] alchemicaRemaining," +
    "uint256 currentRound," +
    "uint256[][] roundBaseAlchemica," +
    "uint256[][] roundAlchemica," +
    "uint256[][4] reservoirs," +
    "uint256[4] alchemicaHarvestRate," +
    "uint256[4] lastUpdateTimestamp," +
    "uint256[4] unclaimedAlchemica," +
    "uint256 altarId," +
    "uint256 upgradeQueueCapacity," +
    "uint256 upgradeQueueLength," +
    "uint256 lodgeId," +
    "bool surveying," +
    "uint16 harvesterCount," +
    "tuple(string title,uint64 startTime,uint64 endTime,uint120 priority,bool equipped,uint64 lastTimeUpdated) gate)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmGettersAndSettersFacet",
      addSelectors: [
        `function getParcelData(uint256 _parcelId) public view returns (${pTuple} memory parcel) `,
        `function getParcelGrids(uint256 _parcelId) external view returns (uint256[64][64] memory buildGrid_, uint256[64][64] memory tileGrid_, uint256[64][64] memory startPositionBuildGrid_, uint256[64][64] memory startPositionTileGrid_)`,
      ],
      removeSelectors: [],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    c.realmDiamond
  )) as OwnershipFacet;

  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
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

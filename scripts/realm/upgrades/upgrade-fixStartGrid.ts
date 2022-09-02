import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { RealmFacet__factory } from "../../../typechain";
import { RealmFacet, RealmFacetInterface } from "../../../typechain/RealmFacet";
import { upgradeDiamondCut } from "./upgrade-diamond";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const c = await varsForNetwork(ethers);

  // await upgradeDiamondCut();

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        // "function moveInstallation(uint256 _realmId, uint256 _installationId, uint256 _x0, uint256 _y0, uint256 _x1, uint256 _y1) external",
        // "function moveTile(uint256 _realmId, uint256 _tileId, uint256 _x0, uint256 _y0, uint256 _x1, uint256 _y1) external",
        // `function setFreezeBuilding(bool _freezeBuilding) external`,
        // "function buildingFrozen() external view returns (bool)",
      ],
      removeSelectors: [
        `function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view`,
      ],
    },
    {
      facetName: "RealmGridFacet",
      addSelectors: [
        "function fixGridStartPositions(uint256[] memory _parcelIds,uint256[] memory _x,uint256[] memory _y,bool _isTile, uint256[] memory _ids) external",
        "function isGridStartPosition(uint256 _parcelId,uint256 _x,uint256 _y,bool _isTile, uint256 _id) external view",
        `function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view`,
        `function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: RealmFacetInterface = new ethers.utils.Interface(
    RealmFacet__factory.abi
  ) as RealmFacetInterface;

  // const calldata = iface.encodeFunctionData("setFreezeBuilding", [true]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    // initCalldata: calldata,
    // initAddress: c.realmDiamond,
  };

  await run("deployUpgrade", args);

  // const realm = (await ethers.getContractAt(
  //   "RealmFacet",
  //   c.realmDiamond
  // )) as RealmFacet;
  // const frozen = await realm.buildingFrozen();
  // console.log("frozem:", frozen);
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

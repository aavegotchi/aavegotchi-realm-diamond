import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { RealmFacet__factory } from "../../../typechain";
import { RealmFacetInterface } from "../../../typechain/RealmFacet";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const diamondAddress = "0x6F8cFe6757F716039498dE53696b1aB5C66Ab428";

  const mintParcelInput =
    "(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)";

  const parcelCoordinates = "(uint256[64][64] coords)";

  const upgradeQueue =
    "(address owner, uint16 coordinateX, uint16 coordinateY, uint40 readyBlock, bool claimed, uint256 parcelId, uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        `function getUserUpgradeQueue(address _owner) external view returns (${upgradeQueue}[] memory output_)`,
        `function getAllUpgradeQueue() external view returns (${upgradeQueue}[] memory)`,
        `function getUpgradeQueueId(uint256 _queueId) external view returns (${upgradeQueue} memory)`,
      ],
      removeSelectors: [
        `function getUpgradeQueue(address _owner) external view returns (${upgradeQueue}[] memory output_)`,
      ],
    },
    // {
    //   facetName: "RealmFacet",
    //   addSelectors: [
    //     `function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view returns (${parcelCoordinates}[] memory)`,
    //     // "function batchGetDistrictParcels(address _owner, uint256 _district) external view returns (uint256[] memory) ",
    //   ],
    //   removeSelectors: [
    //     `function batchGetBuildGrid(uint256[] calldata _parcelIds) external view returns (${parcelCoordinates}[] memory)`,
    //   ],
    // },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: diamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
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

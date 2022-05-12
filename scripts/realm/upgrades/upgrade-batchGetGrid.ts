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
  const diamondAddress = "0x9351e6705590756BAc83f591aDE9f61De5998a84";

  const mintParcelInput =
    "(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)";

  const parcelCoordinates = "(uint256[64][64] coords)";

  const facets: FacetsAndAddSelectors[] = [
    // {
    //   facetName: "InstallationFacet",
    //   addSelectors: [
    //     // `function testingMintParcel(address _to, uint256[] calldata _tokenIds, ${mintParcelInput}[] memory _metadata) external`,
    //   ],
    //   removeSelectors: [],
    // },
    {
      facetName: "RealmFacet",
      addSelectors: [
        `function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view returns (${parcelCoordinates}[] memory)`,
        // "function batchGetDistrictParcels(address _owner, uint256 _district) external view returns (uint256[] memory) ",
      ],
      removeSelectors: [
        `function batchGetBuildGrid(uint256[] calldata _parcelIds) external view returns (${parcelCoordinates}[] memory)`,
      ],
    },
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

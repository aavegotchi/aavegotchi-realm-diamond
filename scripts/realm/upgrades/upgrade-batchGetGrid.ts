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
  const diamondAddress = "0x6bb645178AEd185980e9a9BAB92aA96eB405D7A4";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        // "function batchGetBuildGrid(uint256[] calldata _parcelIds) external view returns (ParcelCoordinates[] memory)",
        // "function batchGetDistrictParcels(address _owner, uint256 _district) external view returns (uint256[] memory) ",
      ],
      removeSelectors: [],
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

import { run } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { maticDiamondAddress } from "../../../constants";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function fixGridStartPositions(uint256[] memory _parcelIds,uint256[] memory _x,uint256[] memory _y,bool _isTile,bool _isTrue) external",
        "function isGridStartPosition(uint256 _parcelId,uint256 _x,uint256 _y,bool _isTile) external view returns (bool)",
        "function moveInstallation(uint256 _realmId, uint256 _installationId, uint256 _x0, uint256 _y0, uint256 _x1, uint256 _y1) external",
        "function moveTile(uint256 _realmId, uint256 _tileId, uint256 _x0, uint256 _y0, uint256 _x1, uint256 _y1) external",
      ],
      removeSelectors: [
        "function fixAltarLevel(uint256[] memory _parcelIds) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
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
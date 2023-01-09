import { run } from "hardhat";
import { maticVars } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  TileFacet,
} from "../../../typechain";
const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        "function addTileTypes((uint8 width,uint8 height,bool deprecated, uint16 tileType,uint32 craftTime,uint256[4] alchemicaCost,string name, uint256 deprecateTime)[] calldata _tileTypes) external",
      ],
      removeSelectors: [
        "function addTileTypes((uint8 width,uint8 height,bool deprecated, uint16 tileType,uint32 craftTime,uint256[4] alchemicaCost,string name)[] calldata _tileTypes) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticVars.tileDiamond,
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

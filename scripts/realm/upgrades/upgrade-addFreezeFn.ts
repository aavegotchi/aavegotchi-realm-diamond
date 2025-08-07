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

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "BounceGateFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "ERC721Facet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "VRFFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [`function setDiamondPaused(bool _paused) external`],
      removeSelectors: [],
    },
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
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

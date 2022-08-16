import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { ERC721Facet__factory } from "../../../typechain";
import { ERC721FacetInterface } from "../../../typechain/ERC721Facet";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";

export const buggedParcel = 24880;
export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  //basically any facet that uses LibERC721.transferFrom
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "ERC721Facet",
      addSelectors: ["function setIndex(uint256 _tokenId) external"],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  //fix a token index while upgrading
  let iface: ERC721FacetInterface = new ethers.utils.Interface(
    ERC721Facet__factory.abi
  ) as ERC721FacetInterface;
  const calldata = iface.encodeFunctionData("setIndex", [buggedParcel]);
  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticRealmDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticRealmDiamondAddress,
    initCalldata: calldata,
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

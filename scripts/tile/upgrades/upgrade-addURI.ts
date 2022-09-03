import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  TileFacet__factory,
  TileFacet,
  OwnershipFacet,
  ERC1155TileFacet,
  ERC1155TileFacet__factory,
} from "../../../typechain";
import { ERC1155TileFacetInterface } from "../../../typechain/ERC1155TileFacet";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    c.tileDiamond
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);

  const iface: ERC1155TileFacetInterface = new ethers.utils.Interface(
    ERC1155TileFacet__factory.abi
  ) as ERC1155TileFacetInterface;
  const calldata = iface.encodeFunctionData("setBaseURI", [
    "https://app.aavegotchi.com/metadata/tile/",
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.tileDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: c.tileDiamond,
    initCalldata: calldata,
  };

  const erc1155Facet = (await ethers.getContractAt(
    "ERC1155TileFacet",
    c.tileDiamond
  )) as ERC1155TileFacet;

  await run("deployUpgrade", args);

  const type = await erc1155Facet.uri("10");
  console.log("uri:", type);
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

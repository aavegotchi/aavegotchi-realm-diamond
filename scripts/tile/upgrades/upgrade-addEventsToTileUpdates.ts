import { LedgerSigner } from "@anders-t/ethers-ledger/lib/ledger";
import { BigNumberish, Signer } from "ethers";
import { run, ethers, network } from "hardhat";
import { maticVars } from "../../../constants";
import { tileTypes } from "../../../data/tiles/tileTypes";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  TileFacet,
  OwnershipFacet,
  TileFacet__factory,
} from "../../../typechain";
import { TileFacetInterface } from "../../../typechain/TileFacet";
import { outputTiles } from "../../realm/realmHelpers";
const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
let signer: Signer;
export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        " function editDeprecateTime(uint256[] calldata _typeIds, uint40[] calldata _deprecateTimes) external",
        " function editTileTypes(uint256[] calldata _typeIds,(uint8 width,uint8 height,bool deprecated, uint16 tileType,uint32 craftTime,uint256[4] alchemicaCost,string name)[] _updatedTiles) external",
      ],
      removeSelectors: [
        "function editTileType(uint256 _typeIds,(uint8 width,uint8 height,bool deprecated, uint16 tileType,uint32 craftTime,uint256[4] alchemicaCost,string name) _updatedTile) external",
        "function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external",
      ],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    maticVars.tileDiamond
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: TileFacetInterface = new ethers.utils.Interface(
    TileFacet__factory.abi
  ) as TileFacetInterface;

  let ids: BigNumberish[] = [];
  for (let i = 0; i < tileTypes.length; i++) {
    ids.push(tileTypes[i].id);
  }

  const calldata = iface.encodeFunctionData("editTileTypes", [
    ids,
    outputTiles(tileTypes),
  ]);
  console.log("updating tiles", ids);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticVars.tileDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: maticVars.tileDiamond,
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

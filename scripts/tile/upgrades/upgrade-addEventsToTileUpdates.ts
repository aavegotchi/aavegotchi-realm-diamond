import { LedgerSigner } from "@anders-t/ethers-ledger/lib/ledger";
import { Signer } from "ethers";
import { run, ethers, network } from "hardhat";
import { maticVars } from "../../../constants";
import { tileTypes } from "../../../data/tiles/tileTypes";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { TileFacet, OwnershipFacet } from "../../../typechain";
import { outputTile } from "../../realm/realmHelpers";
import { diamondOwner, impersonate } from "../helperFunctions";
const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
let signer: Signer;
export async function upgrade() {
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    maticVars.tileDiamond
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticVars.tileDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
  await updateTiles();
}

async function updateTiles() {
  const testing = ["hardhat", "localhost"].includes(network.name);

  let tileFacet = (await ethers.getContractAt(
    "TileFacet",
    maticVars.tileDiamond
  )) as TileFacet;

  if (testing) {
    signer = await ethers.getSigner(diamondUpgrader);
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [diamondUpgrader],
    });

    tileFacet = tileFacet.connect(signer);
  } else if (network.name == "matic") {
    signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");
    tileFacet = tileFacet.connect(signer);
  }

  for (let i = 0; i < tileTypes.length; i++) {
    const id = tileTypes[i].id;
    const tile = outputTile(tileTypes[i]);
    console.log("updating", tileTypes[i].name);

    await tileFacet.editTileType(id, tile);
  }
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

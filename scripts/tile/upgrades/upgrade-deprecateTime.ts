import { run, ethers } from "hardhat";
import { maticTileDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  TileFacet__factory,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";
import { TileFacetInterface } from "../../../typechain/TileFacet";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const oldTileTypeTuple =
    "tuple(uint8 width, uint8 height, bool deprecated, uint16 tileType, uint32 craftTime, uint256[4] alchemicaCost, string name)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TileFacet",
      addSelectors: [
        `function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external`,
      ],
      removeSelectors: [
        `function editTileType(uint256 _typeId, ${oldTileTypeTuple} calldata _tileType) external`,
      ],
    },
  ];

  let iface: TileFacetInterface = new ethers.utils.Interface(
    TileFacet__factory.abi
  ) as TileFacetInterface;

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    maticTileDiamondAddress
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const calldata = iface.encodeFunctionData("editDeprecateTime", [
    "1",
    1651363200,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticTileDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  // const ifacet = (await ethers.getContractAt(
  //   "InstallationFacet",
  //   maticTileDiamondAddress
  // )) as InstallationFacet;

  // let inst = await ifacet.getInstallationTypes(["1"]);
  // console.log("inst:", inst);

  await run("deployUpgrade", args);

  // inst = await ifacet.getInstallationTypes(["1"]);
  // console.log("inst:", inst);
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

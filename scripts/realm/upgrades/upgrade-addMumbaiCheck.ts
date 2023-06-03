import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../constants";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgradeRealmTest() {
  const c = await varsForNetwork(ethers);

  const MintParcelInput =
    "(uint256 coordinateX, uint256 coordinateY,uint256 district,string parcelId,string parcelAddress,uint256 size, uint256[4] boost)";
  const BatchEquipIO = `(uint256[]  types,bool[] equip,uint256[] ids,uint256[] x,uint256[] y)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function fixGrid(uint256 _realmId, uint256 _installationId, uint256[] memory _x, uint256[] memory _y, bool tile) external",
      ],

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
  upgradeRealmTest()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { RealmFacet__factory } from "../../typechain";
import { RealmFacetInterface } from "../../typechain/RealmFacet";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function setAavegotchiDiamond(address _diamondAddress) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "ERC721Facet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  let iface: RealmFacetInterface = new ethers.utils.Interface(
    RealmFacet__factory.abi
  ) as RealmFacetInterface;

  const maticAavegotchiDiamond = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
  const calldata = iface.encodeFunctionData("setAavegotchiDiamond", [
    maticAavegotchiDiamond,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticDiamondAddress,
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

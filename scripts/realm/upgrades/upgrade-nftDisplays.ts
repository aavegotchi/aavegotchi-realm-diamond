import { BigNumber, BigNumberish } from "ethers";
import { ethers, run } from "hardhat";

import { maticVars, varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { NFTDisplayFacet__factory } from "../../../typechain";
import { NFTDisplayFacetInterface } from "../../../typechain/NFTDisplayFacet";
import { maticAavegotchiDiamondAddress } from "../../helperFunctions";
import { maticRealmDiamondAddress } from "../../tile/helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";
  const aaveFrensArtwork = "0xa983b3d938eedf79783ce88ed227a47b6861a3e9";
  const ghstStakingDiamond = "0xA02d547512Bb90002807499F05495Fe9C4C3943f";

  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "NFTDisplayFacet",
      addSelectors: [
        "function toggleWhitelist(address[] calldata _tokens, uint256[] calldata _chainIds,bool[] calldata _whitelist) external",
        "function viewNFTDisplayStatus(address _token, uint256 _chainId) public",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  //TO-DO add remaining addresses
  const addresses: string[] = [
    maticAavegotchiDiamondAddress,
    maticRealmDiamondAddress,
    maticVars.tileDiamond,
    maticVars.installationDiamond,
    aaveFrensArtwork,
    ghstStakingDiamond,
  ];

  const chainIds = [137, 137, 137, 137, 1, 137];

  const whitelists = new Array(chainIds.length).fill(true);

  let iface: NFTDisplayFacetInterface = new ethers.utils.Interface(
    NFTDisplayFacet__factory.abi
  ) as NFTDisplayFacetInterface;

  const calldata = iface.encodeFunctionData("toggleWhitelist", [
    addresses,
    chainIds,
    whitelists,
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initCalldata: calldata,
    initAddress: c.realmDiamond,
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

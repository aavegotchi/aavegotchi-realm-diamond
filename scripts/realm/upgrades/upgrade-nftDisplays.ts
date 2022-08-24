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
  let chainIds: BigNumberish[];
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "NFTDisplayFacet",
      addSelectors: [
        "function whitelistNFTs(address[] calldata _tokens, uint256[] calldata _chainIds) external",
        "function blacklistNFTs(address[] calldata _tokens, uint256[] calldata _chainIds) external",
        "function viewNFTDisplayStatus(address _token, uint256 _chainId) public ",
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
  ];
  //assume all tokens are on matic
  // chainIds = chainIds.fill(BigNumber.from(137), 0, addresses.length - 1);
  chainIds = new Array(addresses.length).fill(BigNumber.from(137));
  let iface: NFTDisplayFacetInterface = new ethers.utils.Interface(
    NFTDisplayFacet__factory.abi
  ) as NFTDisplayFacetInterface;

  const calldata = iface.encodeFunctionData("whitelistNFTs", [
    addresses,
    chainIds,
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

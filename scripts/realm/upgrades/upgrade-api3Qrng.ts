import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { VRFFacet__factory } from "../../../typechain-types";

export async function upgradeApi3Qrng(sponsor, sponsorWallet) {
  // TODO: Check before deploy
  const _api3AirnodeRrp = "0xa0AD79D995DdeeB18a14eAef56A549A04e3Aa1Bd";
  const _api3QrngConfig = {
    numWords: 4,
    // airnode: "0x9d3C147cA16DB954873A498e0af5852AB39139f2",//matic
    airnode: "0x6238772544f029ecaBfDED4300f13A3c4FE84E1D", //mumbai
    endpointId:
      "0x27cc2713e7f968e4e86ed274a051a5c8aaee9cca66946f23af6f29ecea9704c3",
    sponsor,
    sponsorWallet,
  };

  const c = await varsForNetwork(ethers);

  const realmFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "VRFFacet",
      addSelectors: [
        "function api3FulfillRandomWords(bytes32 requestId, bytes calldata data) external",
        "function setApi3QrngConfig(tuple(uint256 numWords, address airnode, bytes32 endpointId, address sponsor, address sponsorWallet) calldata _api3QrngConfig, address _api3AirnodeRrp) external",
      ],
      removeSelectors: [
        "function subscribe() external",
        "function topUpSubscription(uint256 amount) external",
        "function setConfig(tuple(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash) calldata _requestConfig, address _vrfCoordinator) external",
      ],
    },
    {
      facetName: "AlchemicaFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const realmJoined = convertFacetAndSelectorsToString(realmFacets);

  console.log("realm diamond:", c.realmDiamond);

  let iface = new ethers.utils.Interface(VRFFacet__factory.abi);
  const calldata = iface.encodeFunctionData("setApi3QrngConfig", [
    _api3QrngConfig,
    _api3AirnodeRrp,
  ]);

  const realmArgs: DeployUpgradeTaskArgs = {
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: realmJoined,
    useLedger: true,
    useMultisig: false,
    initCalldata: calldata,
    initAddress: c.realmDiamond,
  };

  await run("deployUpgrade", realmArgs);
}

if (require.main === module) {
  upgradeApi3Qrng("", "")
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

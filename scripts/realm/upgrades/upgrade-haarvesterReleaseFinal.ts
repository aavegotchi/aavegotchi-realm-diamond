import { ethers, network, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { VRFFacet__factory } from "../../../typechain";
import { VRFFacetInterface } from "../../../typechain/VRFFacet";
import { upgradeDiamondCut } from "./upgrade-diamond";

export interface VrfConfig {
  subId: number;
  callbackGasLimit: number;
  requestConfirmations: number;
  numWords: number;
  keyHash: string;
}

export async function harvesterUpgrade() {
  const c = await varsForNetwork(ethers);

  await upgradeDiamondCut();

  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [
        "function setTotalAlchemicas(uint256[4][5] calldata _totalAlchemicas) external",
        "function isSurveying(uint256 _realmId) external view",
        "function startSurveying(uint256 _realmId) external",
        "function progressSurveyingRound() external",
        "function claimAvailableAlchemica(uint256 _realmId, uint256 _gotchiId, bytes memory _signature) external",
        "function lastClaimedAlchemica(uint256 _realmId) external view returns (uint256)",
        "function getHarvestRates(uint256 _realmId) external view",
        "function getCapacities(uint256 _realmId) external view",
        "function getTotalClaimed(uint256 _realmId) external view",
      ],
      removeSelectors: [],
    },
    {
      facetName: "VRFFacet",
      addSelectors: [
        "function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external",
        "function subscribe() external",
        "function topUpSubscription(uint256 amount) external",
        `function setConfig(${requestConfig} _requestConfig, address _vrfCoordinator) external`,
      ],
      removeSelectors: [
        // `function setConfig(${requestConfig} _requestConfig) external`,
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: VRFFacetInterface = new ethers.utils.Interface(
    VRFFacet__factory.abi
  ) as VRFFacetInterface;

  let vrfCoordinator: string;
  let vrfConfig: VrfConfig = {
    subId: 0,
    callbackGasLimit: 0,
    requestConfirmations: 0,
    numWords: 0,
    keyHash: "",
  };

  //mumbai
  if (network.name === "mumbai") {
    vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
    vrfConfig = {
      subId: 900,
      callbackGasLimit: 100_000,
      requestConfirmations: 10,
      numWords: 4,
      keyHash:
        "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    };

    //matic
  } else {
    vrfCoordinator = "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed";
    vrfConfig = {
      subId: 900,
      callbackGasLimit: 100_000,
      requestConfirmations: 10,
      numWords: 4,
      keyHash:
        "0x4b09e658ed251bcafeebbc69400383d49f344ace09b9576fe248bb02c003fe9f",
    };
  }

  const calldata = iface.encodeFunctionData("setConfig", [
    vrfConfig,
    vrfCoordinator,
  ]);

  console.log("realm diamond:", c.realmDiamond);

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
  harvesterUpgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

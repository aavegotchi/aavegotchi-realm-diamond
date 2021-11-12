import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { SurveyingFacet__factory } from "../../typechain";
import { SurveyingFacetInterface } from "../../typechain/SurveyingFacet";
import { maticDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "SurveyingFacet",
      addSelectors: [
        "function startSurveying(uint256 _tokenId, uint8 _surveyingRound) external",
        "function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external",
        "function setSurveyingRound(uint8 _surveyingRound) external",
        `function setConfig(${requestConfig} _requestConfig) external`,
        "function setAlchemicas(uint256[4][5] _alchemicas) external",
        "function getAlchemicas() external view returns (uint256[4][5] memory)",
        "function subscribe() external",
        "function topUpSubscription(uint256 amount) external",
      ],
      removeSelectors: [],
    },
  ];

  let iface: SurveyingFacetInterface = new ethers.utils.Interface(
    SurveyingFacet__factory.abi
  ) as SurveyingFacetInterface;

  const hardcodedAlchemicasTotals = [
    [
      [14154, 7076, 3538, 1414],
      [56618, 28308, 14154, 5660],
      [452946, 226472, 113236, 45294],
      [452946, 226472, 113236, 45294],
      [905894, 452946, 226472, 90588],
    ],
  ];

  const calldata = iface.encodeFunctionData(
    //@ts-ignore
    "setAlchemicas",
    hardcodedAlchemicasTotals
  );

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

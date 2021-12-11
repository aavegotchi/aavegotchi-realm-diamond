import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { AlchemicaFacet__factory } from "../../typechain";
import { AlchemicaFacetInterface } from "../../typechain/AlchemicaFacet";
import { maticDiamondAddress } from "../helperFunctions";
import { BigNumberish } from "@ethersproject/bignumber";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const mintParcelsInput =
    "(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [
        "function startSurveying(uint256 _tokenId, uint256 _surveyingRound) external",
        "function progressSurveyingRound() external",
        "function setVars(uint256[4][5] _alchemicas, uint256[4] _greatPortalCapacity, address _installationsDiamond, address _greatPortalDiamond, address _vrfCoordinator, address _linkAddress) external",
        "function getTotalAlchemicas() external view returns (uint256[4][5] memory)",
        "function testingStartSurveying(uint256 _tokenId, uint256 _surveyingRound) external",
        "function getRealmAlchemica(uint256 _tokenId) external view returns (uint256[4] memory)",
        `function testingMintParcel(address _to, uint256[] calldata _tokenIds, ${mintParcelsInput}[] memory _metadata) external`,
      ],
      removeSelectors: [],
    },
    {
      facetName: "VRFFacet",
      addSelectors: [
        "function rawFulfillRandomWords(uint256 requestId, uint256[] memory randomWords) external",
        `function setConfig(${requestConfig} _requestConfig) external`,
        "function subscribe() external",
        "function topUpSubscription(uint256 amount) external",
      ],
      removeSelectors: [],
    },
    {
      facetName: "RealmFacet",
      addSelectors: [
        "function equipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) external",
        "function unequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y) external",
      ],
      removeSelectors: [],
    },
  ];

  let iface: AlchemicaFacetInterface = new ethers.utils.Interface(
    AlchemicaFacet__factory.abi
  ) as AlchemicaFacetInterface;

  const hardcodedAlchemicasTotals = [
    [14154, 7076, 3538, 1414],
    [56618, 28308, 14154, 5660],
    [452946, 226472, 113236, 45294],
    [452946, 226472, 113236, 45294],
    [905894, 452946, 226472, 90588],
  ];

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseUnits("1250000000"),
    ethers.utils.parseUnits("625000000"),
    ethers.utils.parseUnits("312500000"),
    ethers.utils.parseUnits("125000000"),
  ];

  const calldata = iface.encodeFunctionData(
    //@ts-ignore
    "setVars",
    [
      hardcodedAlchemicasTotals,
      greatPortalCapacity,
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
    ]
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

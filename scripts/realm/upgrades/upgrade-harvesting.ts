import { BigNumberish } from "ethers";
import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { AlchemicaFacet__factory } from "../../../typechain";
import { AlchemicaFacetInterface } from "../../../typechain/AlchemicaFacet";
import { maticDiamondAddress } from "../../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const mintParcelsInput =
    "(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)";

  const parcelOutput =
    "(string parcelId, string parcelAddress, address owner, uint256 coordinateX, uint256 coordinateY, uint256 size, uint256 district, uint256[4] boost)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [
        "function setAlchemicaAddresses(address[4] calldata _addresses) external",
        "function startSurveying(uint256 _tokenId) external",
        "function getTotalAlchemicas() external view returns (uint256[4][5] memory)",
        "function getRealmAlchemica(uint256 _tokenId) external view returns (uint256[4] memory)",
        "function progressSurveyingRound() external",
        "function setVars(uint256[4][5] calldata _alchemicas, uint256[4] calldata _boostMultipliers, uint256[4] _greatPortalCapacity, address _installationsDiamond, address _greatPortalDiamond, address _vrfCoordinator, address _linkAddress, address[4] calldata _alchemicaAddresses, bytes memory _backendPubKey, address _gameManager) external",
        "function testingStartSurveying(uint256 _tokenId) external",
        `function testingMintParcel(address _to, uint256[] calldata _tokenIds, ${mintParcelsInput}[] memory _metadata) external`,
        "function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external",
        "function getAvailableAlchemica(uint256 _tokenId) public view returns (uint256[4] memory _availableAlchemica)",
        "function claimAvailableAlchemica(uint256 _tokenId, uint256 _alchemicaType, uint256 _gotchiId, bytes memory _signature) external",
        "function channelAlchemica(uint256 _realmId, uint256 _gotchiId, uint256 _lastChanneled, bytes memory _signature) external",
        "function exitAlchemica(uint256[] calldata _alchemica, uint256 _gotchiId,uint256 _lastExitTime, bytes memory _signature) external",
        "function getRoundAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory)",
        "function getRoundBaseAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory)",
        "function getReservoirSpilloverRate(uint256 _tokenId, uint256 _alchemicaType) external view returns (uint256)",
        "function getAltarSpilloverRate(uint256 _tokenId) external view returns (uint256)",
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
        "function checkCoordinates(uint256 _tokenId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) public view",
        "function upgradeInstallation(uint256 _realmId, uint256 _prevInstallationId, uint256 _nextInstallationId) external",
        "function getParcelCapacity(uint256 _tokenId) external view returns(uint256[4] memory)",
        "function getHumbleGrid(uint256 _parcelId) external view returns (uint256[8][8] memory output_)",
        "function getReasonableGrid(uint256 _parcelId) external view returns (uint256[16][16] memory output_)",
        "function getSpaciousVerticalGrid(uint256 _parcelId) external view returns (uint256[32][64] memory output_)",
        "function getSpaciousHorizontalGrid(uint256 _parcelId) external view returns (uint256[64][32] memory output_)",
        "function getPaartnerGrid(uint256 _parcelId) external view returns (uint256[64][64] memory)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: AlchemicaFacetInterface = new ethers.utils.Interface(
    AlchemicaFacet__factory.abi
  ) as AlchemicaFacetInterface;

  const hardcodedAlchemicasTotals: number[][] = [
    [14154, 7076, 3538, 1414],
    [56618, 28308, 14154, 5660],
    [452946, 226472, 113236, 45294],
    [452946, 226472, 113236, 45294],
    [905894, 452946, 226472, 90588],
  ];

  const alchemicaTotalsBN: BigNumberish[][] = [];

  hardcodedAlchemicasTotals.forEach((element) => {
    alchemicaTotalsBN.push(
      element.map((val) => ethers.utils.parseEther(val.toString()))
    );
  });

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseEther("1250000000"),
    ethers.utils.parseEther("625000000"),
    ethers.utils.parseEther("312500000"),
    ethers.utils.parseEther("125000000"),
  ];

  const boostMultipliers: BigNumberish[] = [
    ethers.utils.parseEther("1000"),
    ethers.utils.parseEther("500"),
    ethers.utils.parseEther("250"),
    ethers.utils.parseEther("100"),
  ];

  const calldata = iface.encodeFunctionData(
    //@ts-ignore
    "setVars",
    [
      alchemicaTotalsBN,
      boostMultipliers,
      greatPortalCapacity,
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      ],
      "0x",
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
    ]
  );

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
    initAddress: maticDiamondAddress,
    initCalldata: calldata,
    useLedger: false,
    useMultisig: false,
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

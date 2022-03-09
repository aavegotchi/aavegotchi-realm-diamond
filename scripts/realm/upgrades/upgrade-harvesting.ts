import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { AlchemicaFacet__factory } from "../../../typechain";
import { AlchemicaFacetInterface } from "../../../typechain/AlchemicaFacet";
import { Alchemica } from "../../../types";
import { maticDiamondAddress } from "../../helperFunctions";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../setVars";

export async function upgrade(
  installationDiamond: string,
  alchemica: Alchemica
) {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const mintParcelsInput =
    "(uint256 coordinateX, uint256 coordinateY, uint256 district, string parcelId, string parcelAddress, uint256 size, uint256[4] boost)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "AlchemicaFacet",
      addSelectors: [
        "function startSurveying(uint256 _tokenId) external",
        "function getTotalAlchemicas() external view returns (uint256[4][5] memory)",
        "function getRealmAlchemica(uint256 _tokenId) external view returns (uint256[4] memory)",
        "function progressSurveyingRound() external",
        "function setVars(uint256[4][5] calldata _alchemicas, uint256[4] calldata _boostMultipliers, uint256[4] _greatPortalCapacity, address _installationsDiamond, address _vrfCoordinator, address _linkAddress, address[4] calldata _alchemicaAddresses, address _glmrAddress, bytes memory _backendPubKey, address _gameManager, address _tileDiamond) external",
        "function testingStartSurveying(uint256 _tokenId) external",
        `function testingMintParcel(address _to, uint256[] calldata _tokenIds, ${mintParcelsInput}[] memory _metadata) external`,
        "function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external",
        "function getAvailableAlchemica(uint256 _tokenId) public view returns (uint256[4] memory _availableAlchemica)",
        "function claimAvailableAlchemica(uint256 _tokenId, uint256[] calldata _alchemicaTypes, uint256 _gotchiId, bytes memory _signature) external",
        "function channelAlchemica(uint256 _realmId, uint256 _gotchiId, uint256 _lastChanneled, bytes memory _signature) external",
        "function exitAlchemica(uint256[] calldata _alchemica, uint256 _gotchiId,uint256 _lastExitTime, bytes memory _signature) external",
        "function getRoundAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory)",
        "function getRoundBaseAlchemica(uint256 _realmId, uint256 _roundId) external view returns (uint256[] memory)",
        "function getLastChanneled(uint256 _gotchiId) public view returns (uint256)",
        "function getAlchemicaAddresses() external view returns (address[4] memory)",
        "function setChannelingLimits(uint256[] calldata _altarLevel, uint256[] calldata _limits) external",
        "function batchTransferAlchemica(address[] calldata _targets, uint256[4][] calldata _amounts) external",
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
        "function equipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y, bytes _signature) external",
        "function unequipInstallation(uint256 _realmId, uint256 _installationId, uint256 _x, uint256 _y, bytes _signature) external",
        "function equipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y, bytes _signature) external",
        "function unequipTile(uint256 _realmId, uint256 _tileId, uint256 _x, uint256 _y, bytes _signature) external",
        "function checkCoordinates(uint256 _tokenId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) public view",
        "function upgradeInstallation(uint256 _realmId, uint256 _prevInstallationId, uint256 _nextInstallationId, uint256 _coordinateX, uint256 _coordinateY) external",
        "function getParcelCapacity(uint256 _tokenId) external view returns(uint256[4] memory)",
        "function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[8][8] memory output_)",
        "function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[16][16] memory output_)",
        "function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[32][64] memory output_)",
        "function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][32] memory output_)",
        "function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view returns (uint256[64][64] memory)",
        "function addUpgradeQueueLength(uint256 _realmId) external",
        "function subUpgradeQueueLength(uint256 _realmId) external",
        "function getParcelUpgradeQueueCapacity(uint256 _parcelId) external view returns (uint256)",
        "function getParcelUpgradeQueueLength(uint256 _parcelId) external view returns (uint256)",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  let iface: AlchemicaFacetInterface = new ethers.utils.Interface(
    AlchemicaFacet__factory.abi
  ) as AlchemicaFacetInterface;

  //@ts-ignore
  const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

  const calldata = iface.encodeFunctionData(
    //@ts-ignore
    "setVars",
    [
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      installationDiamond
        ? installationDiamond
        : "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [alchemica.fud, alchemica.fomo, alchemica.alpha, alchemica.kek],
      alchemica.glmr,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
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
  upgrade("0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5", {
    fud: "",
    fomo: "",
    alpha: "",
    kek: "",
    glmr: "",
  })
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

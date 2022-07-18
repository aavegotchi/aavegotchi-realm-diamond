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

  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const realmFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [
        "function setParcelsAccessRights(uint256[] calldata _realmIds,uint256[] calldata _actionRights, uint256[] calldata _accessRights) external",
        "function resyncParcel(uint256[] calldata _tokenIds) external",
        "function setGameActive(bool _gameActive) external",
        "function getParcelInfo(uint256 _realmId) external view",
        "function checkCoordinates(uint256 _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) external view",
        "function batchGetDistrictParcels(address _owner, uint256 _district) external view",
        "function getParcelUpgradeQueueLength(uint256 _parcelId) external view",
        "function getParcelUpgradeQueueCapacity(uint256 _parcelId) external view",
        "function getParcelsAccessRights(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view",
        "function getAltarId(uint256 _parcelId) external view",
        "function setAltarId(uint256 _parcelId, uint256 _altarId) external",
        "function fixAltarLevel(uint256[] memory _parcelIds) external",
        "function maxSupply() external pure",
      ],
    },
    {
      facetName: "RealmGettersAndSettersFacet",
      addSelectors: [
        "function maxSupply() external pure",
        "function setParcelsAccessRights(uint256[] calldata _realmIds,uint256[] calldata _actionRights, uint256[] calldata _accessRights) external",
        "function resyncParcel(uint256[] calldata _tokenIds) external",
        "function setGameActive(bool _gameActive) external",
        "function getParcelInfo(uint256 _realmId) external view",
        "function checkCoordinates(uint256 _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) external view",
        "function batchGetDistrictParcels(address _owner, uint256 _district) external view",
        "function getParcelUpgradeQueueLength(uint256 _parcelId) external view",
        "function getParcelUpgradeQueueCapacity(uint256 _parcelId) external view",
        "function getParcelsAccessRights(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view",
        "function getAltarId(uint256 _parcelId) external view",
        "function setAltarId(uint256 _parcelId, uint256 _altarId) external",
      ],
      removeSelectors: [],
    },
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
      removeSelectors: [],
    },
  ];

  const installationFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        "function parcelQueueEmpty(uint256 _parcelId) external view returns (bool)",
        "function reduceUpgradeTime(uint256 _upgradeIndex, uint40 _blocks, bytes memory _signature) external",
      ],
      removeSelectors: [],
    },
  ];

  const realmJoined = convertFacetAndSelectorsToString(realmFacets);
  const installationJoined =
    convertFacetAndSelectorsToString(installationFacets);

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
      subId: 114,
      callbackGasLimit: 500_000,
      requestConfirmations: 64,
      numWords: 4,
      keyHash:
        "0x6e099d640cde6de9d40ac749b4b594126b0169747122711109c9985d47751f93",
    };
  }

  const calldata = iface.encodeFunctionData("setConfig", [
    vrfConfig,
    vrfCoordinator,
  ]);

  console.log("realm diamond:", c.realmDiamond);

  const realmArgs: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: realmJoined,
    useLedger: false,
    useMultisig: false,
    initCalldata: calldata,
    initAddress: c.realmDiamond,
  };

  await run("deployUpgrade", realmArgs);

  console.log("installation diamond:", c.installationDiamond);

  const installationArgs: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: installationJoined,
    useLedger: false,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };
  await run("deployUpgrade", installationArgs);
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

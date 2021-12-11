import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { AlchemicaFacet__factory } from "../../typechain";
import { AlchemicaFacetInterface } from "../../typechain/AlchemicaFacet";
import { maticDiamondAddress } from "../helperFunctions";

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
        "function setAlchemicaAddresses(address[4] calldata _addresses) external",
        "function startSurveying(uint256 _tokenId, uint256 _surveyingRound) external",
        "function getTotalAlchemicas() external view returns (uint256[4][5] memory)",
        "function getRealmAlchemica(uint256 _tokenId) external view returns (uint256[4] memory)",
        "function progressSurveyingRound() external",
        "function setVars(uint256[4][5] calldata _alchemicas, uint256[4] _greatPortalCapacity, address _installationsDiamond, address _greatPortalDiamond, address _vrfCoordinator, address _linkAddress, address[4] calldata _alchemicaAddresses, bytes memory _backendPubKey) external",
        "function testingStartSurveying(uint256 _tokenId, uint256 _surveyingRound) external",
        `function testingMintParcel(address _to, uint256[] calldata _tokenIds, ${mintParcelsInput}[] memory _metadata) external`,
        "function getAvailableAlchemica(uint256 _tokenId) public view returns (uint256[4] memory _availableAlchemica)",
        "function claimAvailableAlchemica(uint256 _tokenId, uint256 _alchemicaType, uint256 _gotchiId, bytes memory _signature) external",
        "function testingAlchemicaFaucet(uint256 _alchemicaType, uint256 _amount) external",
        "function channelAlchemica(uint256 _realmId, uint256 _gotchiId) external",
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
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticDiamondAddress,
    facetsAndAddSelectors: joined,
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

import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function harvesterUpgrade() {
  const c = await varsForNetwork(ethers);

  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const realmFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
      ],
      removeSelectors: [
        "function setParcelsAccessRights(uint256[] calldata _realmIds,uint256[] calldata _actionRights, uint256[] calldata _accessRights) external",
        "function resyncParcel(uint256[] calldata _tokenIds) external",
        "function setGameActive(bool _gameActive) external",
        "function getParcelInfo(uint256 _realmId) external view",
        "function checkCoordinates(uint256 _realmId, uint256 _coordinateX, uint256 _coordinateY, uint256 _installationId) external view",
        "function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view",
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
        "function getHumbleGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getReasonableGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getSpaciousVerticalGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getSpaciousHorizontalGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function getPaartnerGrid(uint256 _parcelId, uint256 _gridType) external view",
        "function batchGetGrid(uint256[] calldata _parcelIds, uint256 _gridType) external view",
        "function batchGetDistrictParcels(address _owner, uint256 _district) external view",
        "function getParcelUpgradeQueueLength(uint256 _parcelId) external view",
        "function getParcelUpgradeQueueCapacity(uint256 _parcelId) external view",
        "function getParcelsAccessRights(uint256[] calldata _parcelIds, uint256[] calldata _actionRights) external view",
        "function getAltarId(uint256 _parcelId) external view",
        "function setAltarId(uint256 _parcelId, uint256 _altarId) external",
      ],
      removeSelectors: [],
    }
  ];

  const installationFacets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        "function parcelQueueEmpty(uint256 _parcelId) external view returns (bool)"
      ],
      removeSelectors: [],
    }
  ]

  const realmJoined = convertFacetAndSelectorsToString(realmFacets);
  const installationJoined = convertFacetAndSelectorsToString(installationFacets);

  const realmArgs: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.realmDiamond,
    facetsAndAddSelectors: realmJoined,
    useLedger: false,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };

  const installationArgs: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: installationJoined,
    useLedger: false,
    useMultisig: false,
    initCalldata: "0x",
    initAddress: ethers.constants.AddressZero,
  };

  await run("deployUpgrade", realmArgs);
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

import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { maticInstallationDiamondAddress } from "../../../constants";

import { upgrade as fixDiamond } from "./upgrade-fixDiamond";
export async function upgrade() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  await fixDiamond(maticInstallationDiamondAddress);

  const upgradeQueue =
    "tuple(address owner, uint16 coordinateX, uint16 coordinateY, uint40 readyBlock, bool claimed, uint256 parcelId, uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "DiamondCutFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "InstallationFacet",
      addSelectors: [
        "function craftInstallations(uint16[] calldata _installationTypes, uint40[] calldata _gltr) external",

        //new
        "function balanceOfToken(address _tokenContract,uint256 _tokenId,uint256 _id) public view",
        "function installationBalancesOfToken(address _tokenContract, uint256 _tokenId) public view",
        "function installationBalancesOfTokenWithTypes(address _tokenContract, uint256 _tokenId)external view",
        "function installationBalancesOfTokenByIds(address _tokenContract,uint256 _tokenId,uint256[] calldata _ids) external view",
        "function getCraftQueue(address _owner) external view",
        "function getUserUpgradeQueue(address _owner) external view",
        "function getAllUpgradeQueue() external view",
        "function getUpgradeQueueId(uint256 _queueId) external view",
        "function getAltarLevel(uint256 _altarId) external view",
        "function getLodgeLevel(uint256 _installationId) external view",
        "function getReservoirCapacity(uint256 _installationId) external view",
        "function getReservoirStats(uint256 _installationId) external view",
        "function reduceCraftTime(uint256[] calldata _queueIds, uint40[] calldata _amounts) external",
        "function equipInstallation(address _owner, uint256 _realmId, uint256 _installationId) external",
        "function unequipInstallation(uint256 _realmId, uint256 _installationId) external",
        `function upgradeInstallation(${upgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr)`,
        "function reduceUpgradeTime(uint256 _queueId, uint40 _amount) external",
      ],
      removeSelectors: [
        "function craftInstallations(uint16[] calldata _installationTypes) external",
      ],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        "function finalizeUpgrade() public",
        "function setAddresses(address _aavegotchiDiamond,address _realmDiamond,address _gltr,address _pixelcraft,address _aavegotchiDAO,bytes calldata _backendPubKey) external",
      ],
      removeSelectors: [
        "function setAddresses(address _aavegotchiDiamond,address _realmDiamond,address _gltr,address _pixelcraft,address _aavegotchiDAO,) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
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

import { ethers, network, run } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { ERC1155Facet, InstallationAdminFacet } from "../../../typechain";
import { diamondOwner, impersonate } from "../helperFunctions";
import { addDecorations } from "../updates/addDecorations";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const UpgradeQueue =
    "tuple(address owner,uint16 coordinateX, uint16 coordinateY,uint40 readyBlock,bool claimed,uint256 parcelId,uint256 installationId)";

  const MissingAltars =
    "tuple(uint256 _parcelId, uint256 _oldAltarId, uint256 _newAltarId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function mintInstallations(uint16[] calldata _installationTypes, uint16[] calldata _amounts, address _toAddress) external`,
      ],
      removeSelectors: [
        `function upgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
        "function finalizeUpgrades(uint256[] memory _upgradeIndexes) public",
        `function fixMissingAltars(${MissingAltars}[] memory _altars) external`,
      ],
    },
    {
      facetName: "InstallationFacet",
      addSelectors: [],
      removeSelectors: [
        "function getUserUpgradeQueue(address _owner) external view",
        "function getAllUpgradeQueue() external view",
        "function getUpgradeQueueId(uint256 _queueId) external view",
      ],
    },
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        `function upgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,bytes memory _signature,uint40 _gltr) external`,
        "function finalizeUpgrades(uint256[] memory _upgradeIndexes) public",
        "function getUserUpgradeQueue(address _owner) external view",
        "function getAllUpgradeQueue() external view",
        "function getUpgradeQueueId(uint256 _queueId) external view",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  const erc1155 = (await ethers.getContractAt(
    "ERC1155Facet",
    maticInstallationDiamondAddress
  )) as ERC1155Facet;

  const owner = await diamondOwner(maticInstallationDiamondAddress, ethers);

  let adminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress
  )) as InstallationAdminFacet;
  adminFacet = await impersonate(
    await diamondOwner(maticInstallationDiamondAddress, ethers),
    adminFacet,
    ethers,
    network
  );

  console.log("Add decorations");
  await addDecorations();

  const mintId = "47";

  let balance = await erc1155.balanceOf(owner, mintId);
  console.log("balance before:", balance.toString());

  await adminFacet.mintInstallations([mintId], [1], owner);

  balance = await erc1155.balanceOf(owner, mintId);
  console.log("balance after:", balance.toString());
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

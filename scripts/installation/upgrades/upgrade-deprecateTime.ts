import { run, ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationFacet,
  InstallationAdminFacet,
  InstallationAdminFacet__factory,
  OwnershipFacet,
} from "../../../typechain";
import { outputInstallation } from "../../../data/installations/installationTypes";
import { InstallationAdminFacetInterface } from "../../../typechain/InstallationAdminFacet";
import { InstallationTypeInput, InstallationTypeOutput } from "../../../types";
import { impersonate } from "../../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  //   'function getRaffles() external view returns (tuple(uint256 raffleId, uint256 raffleEnd, bool isOpen)[] raffles_)',

  //   struct InstallationType {
  //     //slot 1
  //     uint8 width;
  //     uint8 height;
  //     uint16 installationType; //0 = altar, 1 = harvester, 2 = reservoir, 3 = gotchi lodge, 4 = wall, 5 = NFT display, 6 = buildqueue booster
  //     uint8 level; //max level 9
  //     uint8 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
  //     uint32 spillRadius;
  //     uint16 spillRate;
  //     uint8 upgradeQueueBoost;
  //     uint32 craftTime; // in blocks
  //     uint32 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
  //     bool deprecated; //bool
  //     //slot 2
  //     uint256[4] alchemicaCost; // [fud, fomo, alpha, kek]
  //     //slot 3
  //     uint256 harvestRate;
  //     //slot 4
  //     uint256 capacity;
  //     //slot 5
  //     uint256[] prerequisites; //IDs of installations that must be present before this installation can be added
  //     //slot 6
  //     string name;
  //     uint40 deprecateTime; //epoch timestamp
  //   }

  const newInstallationTypeTuple =
    "tuple(uint8 width, uint8 height, uint16 installationType, uint8 level, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name, uint40 deprecateTime)";

  const oldInstallationTypeTuple =
    "tuple(uint8 width, uint8 height, uint16 installationType, uint8 level, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        // `function getInstallationType(uint256 _installationTypeId) external view returns (${newInstallationTypeTuple} memory installationType)`,
        // `function getInstallationTypes(uint256[] calldata _installationTypeIds) external view returns (${newInstallationTypeTuple}[] memory installationTypes_)`,
      ],
      removeSelectors: [
        // `function getInstallationType(uint256 _installationTypeId) external view returns (${oldInstallationTypeTuple} memory installationType)`,
        // `function getInstallationTypes(uint256[] calldata _installationTypeIds) external view returns (${oldInstallationTypeTuple}[] memory installationTypes_)`,
      ],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function addInstallationTypes(${newInstallationTypeTuple}[] calldata _installationTypes) external`,
        `function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external`,
      ],
      removeSelectors: [
        `function addInstallationTypes(${oldInstallationTypeTuple}[] calldata _installationTypes) external`,
        `function editInstallationType(uint256 _typeId, ${oldInstallationTypeTuple} calldata _installationType) external`,
      ],
    },
  ];

  let iface: InstallationAdminFacetInterface = new ethers.utils.Interface(
    InstallationAdminFacet__factory.abi
  ) as InstallationAdminFacetInterface;

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    maticInstallationDiamondAddress
  )) as OwnershipFacet;
  const owner = await ownership.owner();
  console.log("owner:", owner);

  const calldata = iface.encodeFunctionData("editDeprecateTime", ["1", 10000]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  let facet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  let installation = await facet.getInstallationType("1");
  console.log("installation:", installation);

  await run("deployUpgrade", args);

  facet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;
  installation = await facet.getInstallationType("1");
  console.log("installation:", installation);
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

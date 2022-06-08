import { run, ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { diamondOwner, maticRealmDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const oldInstallationType =
    "tuple( uint8 width, uint8 height, uint16 installationType, uint8 levell, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name)";

  const newInstallationType =
    "tuple( uint8 width, uint8 height, uint16 installationType, uint8 levell, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name, uint256 unequipType)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function addInstallationTypes(${newInstallationType}[] calldata _installationTypes) external`,
        `function editInstallationUnequipTypes(uint256[] calldata _ids, uint256[] calldata _unequipTypes) external`,
      ],
      removeSelectors: [
        `function addInstallationTypes(${oldInstallationType}[] calldata _installationTypes) external`,
      ],
    },
    {
      facetName: "InstallationFacet",
      addSelectors: [
        "function getInstallationUnequipType(uint256 _installationId) external view",
        "function unequipInstallation(address _owner, uint256 _realmId, uint256 _installationId) external",
      ],
      removeSelectors: [
        "function unequipInstallation(uint256 _realmId, uint256 _installationId) external",
      ],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(
      maticInstallationDiamondAddress,
      ethers
    ),
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  // await run("deployUpgrade", args);

  const facetsRealm: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joinedRealm = convertFacetAndSelectorsToString(facetsRealm);

  const argsRealm: DeployUpgradeTaskArgs = {
    diamondUpgrader: await diamondOwner(maticRealmDiamondAddress, ethers),
    diamondAddress: maticRealmDiamondAddress,
    facetsAndAddSelectors: joinedRealm,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", argsRealm);
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

import { run, ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet__factory,
  InstallationFacet,
  OwnershipFacet,
} from "../../../typechain";
import { InstallationAdminFacetInterface } from "../../../typechain/InstallationAdminFacet";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const oldInstallationTypeTuple =
    "tuple(uint8 width, uint8 height, uint16 installationType, uint8 level, uint8 alchemicaType, uint32 spillRadius, uint16 spillRate, uint8 upgradeQueueBoost, uint32 craftTime, uint32 nextLevelId, bool deprecated, uint256[4] alchemicaCost, uint256 harvestRate, uint256 capacity, uint256[] prerequisites, string name)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [],
      removeSelectors: [],
    },
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function editDeprecateTime(uint256 _typeId, uint40 _deprecateTime) external`,
      ],
      removeSelectors: [
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

  const calldata = iface.encodeFunctionData("editDeprecateTime", [
    "1",
    1651363200,
  ]);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: maticInstallationDiamondAddress,
    initCalldata: calldata,
  };

  const ifacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  let inst = await ifacet.getInstallationTypes(["1"]);
  console.log("inst:", inst);

  await run("deployUpgrade", args);

  inst = await ifacet.getInstallationTypes(["1"]);
  console.log("inst:", inst);
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

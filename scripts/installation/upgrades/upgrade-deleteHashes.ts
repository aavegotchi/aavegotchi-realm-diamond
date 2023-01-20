import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet,
  InstallationAdminFacet__factory,
} from "../../../typechain";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        "  function toggleGameManager(address _newGameManager, bool _active) external",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  let iface = new ethers.utils.Interface(InstallationAdminFacet__factory.abi);
  const calldata = iface.encodeFunctionData("toggleGameManager", [
    c.defenderRelayer,
    true,
  ]);
  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: c.installationDiamond,
    initCalldata: calldata,
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

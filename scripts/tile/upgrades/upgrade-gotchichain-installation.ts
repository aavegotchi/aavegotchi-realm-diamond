import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../constants";
import { DeployUpgradeTaskArgs, FacetsAndAddSelectors, convertFacetAndSelectorsToString } from "../../tasks/deployUpgrade";
import { InstallationFacetInterface } from "../../typechain-types/contracts/InstallationDiamond/facets/InstallationFacet";
import { InstallationFacet__factory } from "../../typechain-types";

const gotchichainBridgeAddress = "0x2a781B3C71e04f13d8Ec2956034EA7De434748d5";

export async function upgradeInstallation(bridgeAddress: string) {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        "function setLayerZeroBridgeAddress(address _newLayerZeroBridge) external",
      ],
      removeSelectors: [],
    },
  ];

  const c = await varsForNetwork(ethers);

  const joined = convertFacetAndSelectorsToString(facets);

  let iface = new ethers.utils.Interface(
    InstallationFacet__factory.abi
  );

  const calldata = iface.encodeFunctionData("setLayerZeroBridgeAddress", [
    bridgeAddress,
  ]);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: false,
    useMultisig: false,
    initAddress: c.installationDiamond,
    initCalldata: calldata,
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeInstallation(gotchichainBridgeAddress)
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

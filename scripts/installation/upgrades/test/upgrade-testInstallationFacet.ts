import { run, ethers } from "hardhat";
import { varsForNetwork } from "../../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

export async function upgradeInstallationTest() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const c = await varsForNetwork(ethers);

  const UpgradeQueue =
    "tuple(address owner,uint16 coordinateX, uint16 coordinateY,uint40 readyBlock,bool claimed,uint256 parcelId,uint256 installationId)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TestInstallationFacet",
      addSelectors: [
        `function mockUpgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,uint40 _gltr) external`,
        `function mockCraftInstallation(uint16 installationId) external`,
        `function mockGetInstallationsLength() external view`,
      ],
      removeSelectors: [],
    },
  ];

  const maticInstallationDiamondAddress = (await varsForNetwork(ethers)).installationDiamond;

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeInstallationTest()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

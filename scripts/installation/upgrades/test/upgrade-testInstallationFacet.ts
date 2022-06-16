import { run, ethers } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../../tasks/deployUpgrade";

export async function upgradeTest() {
  const diamondUpgrader = "0x94cb5C277FCC64C274Bd30847f0821077B231022";

  const UpgradeQueue =
    "tuple(address owner,uint16 coordinateX, uint16 coordinateY,uint40 readyBlock,bool claimed,uint256 parcelId,uint256 installationId)";
  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "TestInstallationFacet",
      addSelectors: [
        `function testUpgradeInstallation(${UpgradeQueue} calldata _upgradeQueue,uint40 _gltr) external`,
        `function testCraftInstallations(uint16[] calldata _installationTypes) external`,
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
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  await run("deployUpgrade", args);
}

if (require.main === module) {
  upgradeTest()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

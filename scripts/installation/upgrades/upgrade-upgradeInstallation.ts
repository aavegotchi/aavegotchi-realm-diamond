import { run, ethers } from "hardhat";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../tasks/deployUpgrade";
import { InstallationFacet__factory } from "../../typechain";
import { InstallationFacetInterface } from "../../typechain/InstallationFacet";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const requestConfig =
    "(uint64 subId, uint32 callbackGasLimit, uint16 requestConfirmations, uint32 numWords, bytes32 keyHash)";

  const UpgradeQueue =
    "(uint256 parcelId, uint256 coordinateX, uint256 coordinateY, uint256 installationId, uint256 readyBlock, bool claimed, address owner)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationFacet",
      addSelectors: [
        `function upgradeInstallation(${UpgradeQueue} _upgradeQueue) external`,
        "function finalizeUpgrade() public ",
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
    facetsAndAddSelectors: joined,
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

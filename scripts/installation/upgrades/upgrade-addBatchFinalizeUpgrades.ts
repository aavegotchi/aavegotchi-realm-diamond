import { run, ethers, network } from "hardhat";
//import { maticTileDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { OwnershipFacet } from "../../../typechain-types";
import { varsForNetwork } from "../../../constants";

export async function upgrade() {
  const c = await varsForNetwork(ethers);

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationUpgradeFacet",
      addSelectors: [
        "function finalizeUpgradesForParcels(uint256[] memory _parcelIds) external",
      ],
      removeSelectors: [],
    },
  ];

  const ownership = (await ethers.getContractAt(
    "OwnershipFacet",
    c.installationDiamond
  )) as OwnershipFacet;

  const owner = await ownership.owner();
  console.log("owner:", owner);

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
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
  upgrade()
    .then(() => process.exit(0))
    // .then(() => console.log('upgrade completed') /* process.exit(0) */)
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

import { ethers, run } from "hardhat";
import { varsForNetwork } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const WipeHashStruct = `tuple(uint256 parcelId, uint256 coordinateX, uint256 coordinateY, uint256 installationId)`;

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const c = await varsForNetwork(ethers);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  await run("deployUpgrade", args);

  // const buggedParcels = ["49811", "9092"];

  // const installationUpgradeFacet = (await ethers.getContractAt(
  //   "InstallationUpgradeFacet",
  //   maticInstallationDiamondAddress
  // )) as InstallationUpgradeFacet;

  // let adminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   maticInstallationDiamondAddress,
  //   signer
  // )) as InstallationAdminFacet;

  // console.log("add upgrade queue");
  // await adminFacet.addUpgradeQueueLength(["9092"], { gasPrice: gasPrice });

  // const queue: UpgradeQueue = {
  //   parcelId: "49811",
  //   coordinateX: 0,
  //   coordinateY: 0,
  //   installationId: 10,
  //   readyBlock: 0,
  //   owner: "0x4331b37a19d68a36b7f7ad6ee50864d6b98ff087",
  //   claimed: false,
  // };

  // await installationUpgradeFacet.finalizeUpgrades(["6788"]);
  // for await (const parcel of buggedParcels) {
  //   const length = await realmFacet.getParcelUpgradeQueueLength(parcel);
  //   console.log("length:", length);
  // }
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

import { run, ethers, network } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";
import { GLTR_ADDRESS } from "../../../helpers/constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet,
  InstallationFacet,
  RealmFacet,
} from "../../../typechain";
import { UpgradeQueue } from "../../../types";
import { genUpgradeInstallationSignature } from "../../realm/realmHelpers";
import { impersonate, maticRealmDiamondAddress } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [],
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
  };

  await run("deployUpgrade", args);

  // const parcelId = "3783";
  // const owner = "0x51208e5cC9215c6360210C48F81C8270637a5218";

  // let adminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   maticInstallationDiamondAddress
  // )) as InstallationAdminFacet;
  // adminFacet = await impersonate(owner, adminFacet, ethers, network);

  // const upgradeQueue: UpgradeQueue = {
  //   owner: owner,
  //   coordinateX: 3,
  //   coordinateY: 2,
  //   readyBlock: 0,
  //   claimed: false,
  //   parcelId: parcelId,
  //   installationId: "11",
  // };

  // const signature = await genUpgradeInstallationSignature(
  //   Number(parcelId),
  //   3,
  //   2,
  //   11
  // );

  // const gltrToken = await ethers.getContractAt("ERC20", GLTR_ADDRESS);
  // let balance = await gltrToken.balanceOf(owner);

  // console.log(ethers.utils.formatEther(balance));

  // console.log("upgrading");
  // await adminFacet.upgradeInstallation(upgradeQueue, signature, 100000);

  // const installationfacet = (await ethers.getContractAt(
  //   "InstallationFacet",
  //   maticInstallationDiamondAddress
  // )) as InstallationFacet;

  // const filter = adminFacet.filters["UpgradeQueued(address,uint256,uint256)"](
  //   owner,
  //   ethers.utils.hexlify(Number(parcelId))
  // );
  // const upgradeIndexHex = (await installationfacet.queryFilter(filter))[0]
  //   .topics[3];
  // const upgradeIndex = parseInt(upgradeIndexHex);
  // console.log("upgrade index:", upgradeIndex);

  // const upgrade = await installationfacet.getUpgradeQueueId(upgradeIndex);
  // console.log("upgrade:", upgrade);

  // balance = await gltrToken.balanceOf(owner);
  // console.log(ethers.utils.formatEther(balance));
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

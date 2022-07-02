import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network, run } from "hardhat";
import { maticInstallationDiamondAddress } from "../../../constants";

import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import {
  InstallationAdminFacet,
  InstallationFacet,
  InstallationUpgradeFacet,
} from "../../../typechain";
import {
  diamondOwner,
  gasPrice,
  impersonate,
  maticRealmDiamondAddress,
} from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const MissingAltars =
    "tuple(uint256 _parcelId, uint256 _oldAltarId, uint256 _newAltarId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function fixMissingAltars(${MissingAltars}[] memory _altars) external`,
      ],
      removeSelectors: [],
    },
  ];

  const buggedAltars = [
    [183, 11, 12],
    [468, 10, 11],
    [638, 2, 3],
    [644, 11, 12],
    [817, 10, 11],
    [893, 11, 12],
    [1702, 10, 11],
    [2037, 10, 11],
    [2638, 12, 13],
    [3936, 10, 11],
    [4575, 13, 14],
    [5015, 13, 14],
    [6200, 1, 2],
    [6594, 12, 13],
    [7302, 12, 13],
    [7332, 10, 11],
    [7645, 11, 12],
    [7670, 11, 12],
    [7723, 11, 12],
    [7818, 11, 12],
    [7906, 11, 12],
    [7986, 10, 11],
    [8083, 10, 11],
    [8729, 1, 2],
    [10132, 1, 2],
    [11053, 10, 11],
    [12576, 10, 11],
    [13211, 10, 11],
    [14377, 10, 11],
    [14404, 12, 13],
    [14523, 12, 13],
    [16799, 10, 11],
    [17871, 10, 11],
    [17963, 10, 11],
    [18162, 10, 11],
    [18288, 11, 12],
    [19094, 10, 11],
    [19349, 10, 11],
    [19933, 10, 11],
    [19999, 10, 11],
    [20107, 11, 12],
    [20443, 11, 12],
    [20939, 10, 11],
    [20993, 10, 11],
    [21658, 10, 11],
    [21717, 10, 11],
    [21773, 10, 11],
    [24595, 10, 11],
    [26494, 12, 13],
    [26804, 11, 12],
    [28846, 10, 11],
    [30677, 10, 11],
    [33497, 11, 12],
    [46200, 10, 11],
    [52198, 13, 14],
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: maticInstallationDiamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
  };

  // await run("deployUpgrade", args);

  const installationsFacet = (await ethers.getContractAt(
    "InstallationFacet",
    maticInstallationDiamondAddress
  )) as InstallationFacet;

  // for await (const buggedAltar of buggedAltars) {
  //   const tokenbal = await installationsFacet.installationBalancesOfToken(
  //     maticRealmDiamondAddress,
  //     buggedAltar[0]
  //   );

  //   console.log(`Token balance of ${buggedAltar[0]}: ${tokenbal}`);
  // }

  let installationAdminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    maticInstallationDiamondAddress,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    installationAdminFacet = await impersonate(
      await diamondOwner(maticInstallationDiamondAddress, ethers),
      installationAdminFacet,
      ethers,
      network
    );
  }

  //@ts-ignore
  const tx = await installationAdminFacet.fixMissingAltars(buggedAltars, {
    gasPrice: gasPrice,
  });
  await tx.wait();

  // for await (const buggedAltar of buggedAltars) {
  //   const tokenbal = await installationsFacet.installationBalancesOfToken(
  //     maticRealmDiamondAddress,
  //     buggedAltar[0]
  //   );

  //   console.log(`Token balance of ${buggedAltar[0]}: ${tokenbal}`);
  // }

  //26247, 25730, 18707, 18938, 25461, 25964

  // const upgrades = await installationUpgradeFacet.getUserUpgradeQueue(
  //   "0x2848b9f2d4faebaa4838c41071684c70688b455d"
  // );

  // console.log("upgrades:", upgrades);

  // let balance = await installationsFacet.installationBalancesOfToken(
  //   maticRealmDiamondAddress,
  //   7958
  // );

  // console.log("balance:", balance);

  // const signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  // let adminFacet = (await ethers.getContractAt(
  //   "InstallationAdminFacet",
  //   maticInstallationDiamondAddress,
  //   signer
  // )) as InstallationAdminFacet;

  // if (network.name === "hardhat") {
  //   adminFacet = await impersonate(
  //     await diamondOwner(maticInstallationDiamondAddress, ethers),
  //     adminFacet,
  //     ethers,
  //     network
  //   );
  // }

  // //@ts-ignore
  // await adminFacet.fixMissingAltars(buggedAltars, { gasPrice: gasPrice });

  // balance = await installationsFacet.installationBalancesOfToken(
  //   maticRealmDiamondAddress,
  //   7958
  // );

  // console.log("balance:", balance);

  // await adminFacet.finalizeUpgrades(["5408"]);
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

/*
  const graphIds = {
    "1": 59,
    "2": 36,
    "3": 48,
    "4": 18,
    "5": 4,
    "6": 3,
    "7": 2,
    "9": 1,
    "10": 8604,
    "11": 3584,
    "12": 2195,
    "13": 338,
    "14": 22,
    "15": 15,
  };
*/

// const onchainTokens = [
//   "10: 9238",
//   "11: 3781",
//   "1: 69",
//   "2: 40",
//   "12: 2296",
//   "3: 57",
//   "13: 297",
//   "8: 1",
//   "4: 18",
//   "6: 2",
//   "16: 1",
//   "5: 6",
//   "14: 14",
//   "15: 2",
// ];

// tokens: [
//   '10: 9234', '11: 3852',
//   '1: 68',    '2: 42',
//   '12: 2405', '3: 57',
//   '13: 383',  '8: 2',
//   '4: 21',    '6: 3',
//   '16: 1',    '5: 6',
//   '14: 25',   '15: 14',
//   '7: 2',     '9: 1',
//   '17: 1'
// ]

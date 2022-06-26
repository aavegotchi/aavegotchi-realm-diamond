import { LedgerSigner } from "@anders-t/ethers-ledger";
import { ethers, network, run } from "hardhat";
import {
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
} from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { InstallationAdminFacet, RealmFacet } from "../../../typechain";
import { diamondOwner, gasPrice, impersonate } from "../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";

  const wipeHash =
    "tuple(uint256 parcelId, uint256 coordinateX,uint256 coordinateY, uint256 installationId)";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "InstallationAdminFacet",
      addSelectors: [
        `function wipeHashes(${wipeHash}[] calldata _entries) external`,
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
  };

  // const buggedParcels = ["49811", "9092"];

  interface WipeHash {
    parcelId: number;
    coordinateX: number;
    coordinateY: number;
    installationId: number;
  }

  const wipeHashes: WipeHash[] = [
    {
      parcelId: 49811,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 10,
    },
    {
      parcelId: 9092,
      coordinateX: 3,
      coordinateY: 3,
      installationId: 10,
    },
  ];

  // const realmFacet = (await ethers.getContractAt(
  //   "RealmFacet",
  //   maticRealmDiamondAddress
  // )) as RealmFacet;

  // for await (const parcel of buggedParcels) {
  //   const length = await realmFacet.getParcelUpgradeQueueLength(parcel);
  //   console.log("length:", length);
  // }

  // await run("deployUpgrade", args);

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

  await installationAdminFacet.wipeHashes(wipeHashes, {
    gasPrice: gasPrice,
  });

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

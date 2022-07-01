import { LedgerSigner } from "@anders-t/ethers-ledger";
import { run, ethers, network } from "hardhat";
import { varsForNetwork } from "../../../constants";
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
import { diamondOwner, gasPrice, impersonate } from "../../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";

  const c = await varsForNetwork(ethers);
  const maticRealmDiamondAddress = c.realmDiamond;

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
    diamondAddress: c.installationDiamond,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  // await run("deployUpgrade", args);

  let signer = new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0");

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticRealmDiamondAddress,
    signer
  )) as RealmFacet;

  if (network.name === "hardhat") {
    realmFacet = await impersonate(
      await diamondOwner(maticRealmDiamondAddress, ethers),
      realmFacet,
      ethers,
      network
    );
  }

  const parcelId = "6630";

  const installationsFacet = (await ethers.getContractAt(
    "InstallationFacet",
    c.installationDiamond
  )) as InstallationFacet;
  let balances = await installationsFacet.installationBalancesOfToken(
    c.realmDiamond,
    parcelId
  );

  console.log("balances:", balances);

  let altarId = await realmFacet.getAltarId(parcelId);

  console.log("altar id:", altarId);

  console.log("Set altar id");
  let tx = await realmFacet.setAltarId(parcelId, "10", {
    gasPrice: gasPrice,
  });
  await tx.wait();

  altarId = await realmFacet.getAltarId(parcelId);

  console.log("altar id:", altarId);

  let adminFacet = (await ethers.getContractAt(
    "InstallationAdminFacet",
    c.installationDiamond,
    signer
  )) as InstallationAdminFacet;

  if (network.name === "hardhat") {
    adminFacet = await impersonate(
      await diamondOwner(c.installationDiamond, ethers),
      adminFacet,
      ethers,
      network
    );
  }

  const altar = {
    _parcelId: parcelId,
    _oldAltarId: 0,
    _newAltarId: 10,
  };

  console.log("Update token balance");
  tx = await adminFacet.fixMissingAltars([altar], { gasPrice: gasPrice });
  await tx.wait();

  balances = await installationsFacet.installationBalancesOfToken(
    c.realmDiamond,
    parcelId
  );
  console.log("balances after:", balances);
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

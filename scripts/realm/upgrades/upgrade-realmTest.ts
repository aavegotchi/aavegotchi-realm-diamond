import { LedgerSigner } from "@anders-t/ethers-ledger";
import { run, ethers, network } from "hardhat";
import { maticRealmDiamondAddress } from "../../../constants";
import {
  convertFacetAndSelectorsToString,
  DeployUpgradeTaskArgs,
  FacetsAndAddSelectors,
} from "../../../tasks/deployUpgrade";
import { RealmFacet } from "../../../typechain";
import { diamondOwner, gasPrice, impersonate } from "../../helperFunctions";

export async function upgrade() {
  const diamondUpgrader = "0xa370f2ADd2A9Fba8759147995d6A0641F8d7C119";
  const diamondAddress = "0x1d0360bac7299c86ec8e99d0c1c9a95fefaf2a11";

  const facets: FacetsAndAddSelectors[] = [
    {
      facetName: "RealmFacet",
      addSelectors: [
        `function getAltarId(uint256 _parcelId) external view returns (uint256)`,
        `function setAltarId(uint256 _parcelId, uint256 _altarId) external`,
      ],
      removeSelectors: [],
    },
  ];

  const joined = convertFacetAndSelectorsToString(facets);

  const args: DeployUpgradeTaskArgs = {
    diamondUpgrader: diamondUpgrader,
    diamondAddress: diamondAddress,
    facetsAndAddSelectors: joined,
    useLedger: true,
    useMultisig: false,
    initAddress: ethers.constants.AddressZero,
    initCalldata: "0x",
  };

  // await run("deployUpgrade", args);

  let realmFacet = (await ethers.getContractAt(
    "RealmFacet",
    maticRealmDiamondAddress,
    new LedgerSigner(ethers.provider, "m/44'/60'/2'/0/0")
  )) as RealmFacet;

  if (network.name === "hardhat") {
    realmFacet = await impersonate(
      await diamondOwner(maticRealmDiamondAddress, ethers),
      realmFacet,
      ethers,
      network
    );
  }

  // let altarId = await realmFacet.getAltarId("9571");

  // console.log("altar id:", altarId);

  console.log("Set altar id");
  const tx = await realmFacet.setAltarId("9571", "10", { gasPrice: gasPrice });
  await tx.wait();

  const altarId = await realmFacet.getAltarId("9571");

  console.log("altar id:", altarId);
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

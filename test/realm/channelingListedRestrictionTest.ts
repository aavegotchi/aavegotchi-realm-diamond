import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { varsForNetwork, alchemica } from "../../constants";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import { expect } from "chai";
import {
  InstallationFacet,
  RealmFacet,
  TileFacet,
  OwnershipFacet,
  AlchemicaFacet,
} from "../../typechain";
import {
  approveAlchemica,
  mintAlchemica,
  genEquipInstallationSignature,
  genChannelAlchemicaSignature,
  genUpgradeInstallationSignature,
} from "../../scripts/realm/realmHelpers";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import { impersonate } from "../../scripts/helperFunctions";
import { upgradeChannelingRestrictions } from "../../scripts/alchemica/upgradeChannelingRestrictions";

describe("Channeling Restrictions during Lending Listing", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;
  const testGotchiId2 = 23491;
  const testGotchiId3 = 19652;

  let realmFacet: RealmFacet;
  let alchemicaFacet: AlchemicaFacet;
  let ownershipFacet: OwnershipFacet;
  let ownerAddress: string;
  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    upgradeChannelingRestrictions();

    const c = await varsForNetwork(ethers);

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond
    )) as AlchemicaFacet;

    // g.alchemicaFacet = await impersonate(
    //   g.ownerAddress,
    //   g.alchemicaFacet,
    //   ethers,
    //   network
    // );

    // await g.alchemicaFacet.setChannelingLimits([1, 2], [86400, 64800]);
    const backendSigner = new ethers.Wallet(process.env.PROD_PK);

    await alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      c.installationDiamond,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [alchemica[0], alchemica[1], alchemica[2], alchemica[3]],
      "0x0000000000000000000000000000000000000000",
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      c.realmDiamond,
      c.tileDiamond,
      c.aavegotchiDiamond
    );
  });

  it("Should channel Alchemica", async function () {
    const lastChanneled = await alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    // await alchemicaFacet.channelAlchemica(
    //   testParcelId,
    //   testGotchiId,
    //   lastChanneled,
    //   signature
    // );
  });
});

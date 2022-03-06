import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  approveAlchemica,
  beforeTest,
  faucetAlchemica,
  genEquipInstallationSignature,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));
  });
  // it("Deploy alchemica ERC20s", async function () {
  //   g.alchemicaFacet = await impersonate(
  //     g.ownerAddress,
  //     g.alchemicaFacet,
  //     ethers,
  //     network
  //   );
  //   //@ts-ignore
  //   const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
  //   await g.alchemicaFacet.setVars(
  //     //@ts-ignore
  //     alchemicaTotals(),
  //     boostMultipliers,
  //     greatPortalCapacity,
  //     g.installationsAddress,
  //     "0x0000000000000000000000000000000000000000",
  //     "0x0000000000000000000000000000000000000000",
  //     [g.fud.address, g.fomo.address, g.alpha.address, g.kek.address],
  //     g.glmr.address,
  //     ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
  //     g.ownerAddress,
  //     g.tileAddress
  //   );
  //   await network.provider.send("hardhat_setBalance", [
  //     maticDiamondAddress,
  //     "0x1000000000000000",
  //   ]);
  // });
  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationAdminFacet.addInstallationTypes(testInstallations());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });
  it("Craft installations", async function () {
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    await expect(
      g.installationDiamond.craftInstallations([2, 2, 2, 5])
    ).to.be.revertedWith("ERC20: insufficient allowance");

    await faucetAlchemica(g.alchemicaFacet, [
      "20000",
      "20000",
      "20000",
      "20000",
    ]);

    await approveAlchemica(g, ethers, testAddress, network);

    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.installationDiamond.craftInstallations([2, 2, 2, 6]);
    let fudAfterCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekAfterCraft = await g.kek.balanceOf(maticDiamondAddress);
    expect(Number(ethers.utils.formatUnits(fudAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(fudPreCraft))
    );
    expect(Number(ethers.utils.formatUnits(kekAfterCraft))).to.above(
      Number(ethers.utils.formatUnits(kekPreCraft))
    );
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");

    await mineBlocks(ethers, 21000);

    await g.installationDiamond.claimInstallations([1, 2, 3]);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip installations", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      0,
      0,
      await genEquipInstallationSignature(2, 0, 0, testParcelId)
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      2,
      3,
      3,
      await genEquipInstallationSignature(2, 3, 3, testParcelId)
    );
  });
  it("Test upgrade queue", async function () {
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    const upgradeQueue2: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 3,
      coordinateY: 3,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);
    await expect(
      g.installationDiamond.upgradeInstallation(upgradeQueue)
    ).to.be.revertedWith("InstallationFacet: UpgradeQueue full");
    await expect(
      g.installationDiamond.upgradeInstallation(upgradeQueue2)
    ).to.be.revertedWith("InstallationFacet: UpgradeQueue full");
    await g.realmFacet.equipInstallation(
      testParcelId,
      6,
      6,
      6,
      await genEquipInstallationSignature(6, 6, 6, testParcelId)
    );
    await g.installationDiamond.upgradeInstallation(upgradeQueue2);
  });
});

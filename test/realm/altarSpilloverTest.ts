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
  beforeTest,
  testInstallations,
  genChannelAlchemicaSignature,
} from "../../scripts/realm/realmHelpers";
import { isFunctionDeclaration } from "typescript";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;
  const fudChannelAmount = 100;

  let g: TestBeforeVars;

  const genSignature = async (tileId: number, x: number, y: number) => {
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    let messageHash1 = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256", "uint256"],
      [testParcelId, tileId, x, y]
    );
    let signedMessage1 = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash1)
    );
    let signature1 = ethers.utils.arrayify(signedMessage1);

    return signature1;
  };

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));
  });
  it("Deploy alchemica ERC20s", async function () {
    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      g.installationsAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [g.fud.address, g.fomo.address, g.alpha.address, g.kek.address],
      g.glmr.address,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      g.ownerAddress,
      g.tileAddress
    );
    await network.provider.send("hardhat_setBalance", [
      maticDiamondAddress,
      "0x1000000000000000",
    ]);
  });
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
      g.installationDiamond.craftInstallations([4])
    ).to.be.revertedWith("ERC20: insufficient allowance");
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("20000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      1,
      ethers.utils.parseUnits("300")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      2,
      ethers.utils.parseUnits("300")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      3,
      ethers.utils.parseUnits("300")
    );
    g.fud = await impersonate(testAddress, g.fud, ethers, network);
    g.fomo = await impersonate(testAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(testAddress, g.alpha, ethers, network);
    g.kek = await impersonate(testAddress, g.kek, ethers, network);
    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await g.fud.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.fomo.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.alpha.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.kek.approve(
      g.installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    let fudPreCraft = await g.fud.balanceOf(maticDiamondAddress);
    let kekPreCraft = await g.kek.balanceOf(maticDiamondAddress);
    await g.installationDiamond.craftInstallations([4]);
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

    g.glmr = await impersonate(testAddress, g.glmr, ethers, network);
    await g.glmr.mint(ethers.utils.parseUnits("100000"));
    await g.glmr.approve(
      g.installationDiamond.address,
      ethers.utils.parseUnits("100000")
    );
    await g.installationDiamond.reduceCraftTime([0], [100]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    await g.installationDiamond.reduceCraftTime([0], [10000]);
    await g.installationDiamond.claimInstallations([0]);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip altar", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(
      testParcelId,
      4,
      0,
      0,
      await genSignature(4, 0, 0)
    );
  });
  it("Test spillover level 1", async function () {
    const spillrateLevel1 = Number(
      ethers.utils.formatUnits(await g.installationDiamond.spilloverRateOfId(4))
    );
    const playerShare = 100 - spillrateLevel1;

    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    const balancePreFud = await g.fud.balanceOf(testAddress);

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );

    const balancePostFud = await g.fud.balanceOf(testAddress);

    const channeledFud =
      Number(ethers.utils.formatUnits(balancePostFud)) -
      Number(ethers.utils.formatUnits(balancePreFud));
    expect(channeledFud).to.equal((fudChannelAmount * playerShare) / 100);
  });
  it("Upgrade altar", async function () {
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 4,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);

    await mineBlocks(ethers, 21000);
    await g.installationDiamond.finalizeUpgrade();
  });
  it("Test spillover level 2", async function () {
    await mineBlocks(ethers, 71000);

    const spillrateLevel2 = Number(
      ethers.utils.formatUnits(await g.installationDiamond.spilloverRateOfId(7))
    );
    const playerShare = 100 - spillrateLevel2;

    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    const balancePreFud = await g.fud.balanceOf(testAddress);

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );

    const balancePostFud = await g.fud.balanceOf(testAddress);

    const channeledFud =
      Number(ethers.utils.formatUnits(balancePostFud)) -
      Number(ethers.utils.formatUnits(balancePreFud));
    expect(channeledFud).to.equal((fudChannelAmount * playerShare) / 100);
  });
});

import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { AlchemicaToken } from "../../typechain";
import { TestBeforeVars, UpgradeQueue } from "../../types";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  beforeTest,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const installationsAddress = "0x75139C13199A3470A0505AdBEa4f25570FFf362b";
  const installationsOwner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const alchemicaForTester = ethers.utils.parseUnits("500000");
  const testParcelId = 2893;

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);
    g = await beforeTest(ethers);
  });
  it("Deploy alchemica ERC20s", async function () {
    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    // const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5",
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
        "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
      ],
      "0x",
      "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5"
    );
    await network.provider.send("hardhat_setBalance", [
      maticDiamondAddress,
      "0x1000000000000000",
    ]);
  });
  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      installationsOwner,
      g.installationDiamond,
      ethers,
      network
    );

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationDiamond.addInstallationTypes(testInstallations());
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
    await g.alchemicaFacet.testingAlchemicaFaucet(0, alchemicaForTester);
    await g.alchemicaFacet.testingAlchemicaFaucet(1, alchemicaForTester);
    await g.alchemicaFacet.testingAlchemicaFaucet(2, alchemicaForTester);
    await g.alchemicaFacet.testingAlchemicaFaucet(3, alchemicaForTester);
    g.fud = await impersonate(testAddress, g.fud, ethers, network);
    g.fomo = await impersonate(testAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(testAddress, g.alpha, ethers, network);
    g.kek = await impersonate(testAddress, g.kek, ethers, network);
    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await g.fud.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.fomo.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.alpha.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.kek.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await g.installationDiamond.craftInstallations([2]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");

    await mineBlocks(ethers, 21000);

    const erc1155facet = await ethers.getContractAt(
      "ERC1155Facet",
      g.installationDiamond.address
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.installationDiamond.claimInstallations([0]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip reservoir", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(testParcelId, 2, 0, 0);
  });
  it("Upgrade reservoir", async function () {
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);
    let capacityPreUpgrade = await g.realmFacet.getParcelCapacity(testParcelId);
    await g.installationDiamond.finalizeUpgrade();
    let capacityPostUpgradePreReadyBlock = await g.realmFacet.getParcelCapacity(
      testParcelId
    );
    expect(ethers.utils.formatUnits(capacityPreUpgrade[0])).to.equal(
      ethers.utils.formatUnits(capacityPostUpgradePreReadyBlock[0])
    );

    await mineBlocks(ethers, 51000);

    await g.installationDiamond.finalizeUpgrade();
    let capacityPostUpgradePostReadyBlock =
      await g.realmFacet.getParcelCapacity(testParcelId);
    expect(
      Number(ethers.utils.formatUnits(capacityPostUpgradePostReadyBlock[0]))
    ).to.above(Number(ethers.utils.formatUnits(capacityPreUpgrade[0])));
  });
});

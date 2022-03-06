import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import { TestBeforeVars } from "../../types";

import {
  approveAlchemica,
  beforeTest,
  faucetAlchemica,
  genEquipInstallationSignature,
  genChannelAlchemicaSignature,
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
  it("Survey Parcel", async function () {
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    await g.alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Craft and equip altar", async function () {
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );

    await faucetAlchemica(g.alchemicaFacet, ["20000", "300", "300", "300"]);
    g = await approveAlchemica(g, ethers, testAddress, network);

    g.fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await g.installationDiamond.craftInstallations([4]);

    await mineBlocks(ethers, 21000);

    await g.installationDiamond.claimInstallations([0]);
    await g.realmFacet.equipInstallation(
      testParcelId,
      4,
      0,
      0,
      await genEquipInstallationSignature(4, 0, 0, testParcelId)
    );
  });
  it("Test 1 day cooldown", async function () {
    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );
    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId,
        lastChanneled,
        signature
      )
    ).to.be.revertedWith("AlchemicaFacet: Incorrect last duration");
    const lastChanneled2 = await g.alchemicaFacet.getLastChanneled(
      testGotchiId
    );

    const signature2 = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled2
    );

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId,
        lastChanneled2,
        signature2
      )
    ).to.be.revertedWith("AlchemicaFacet: Can't channel yet");
  });
  it("Test minting new tokens on channeling", async function () {
    const spillrate = 0.2;
    const fudChannelAmount = 100;
    const balanceFudPre = await g.fud.balanceOf(maticDiamondAddress);

    await mineBlocks(ethers, 90000);

    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );
    const balanceFudAfter = await g.fud.balanceOf(maticDiamondAddress);
    expect(Number(ethers.utils.formatUnits(balanceFudAfter))).to.equal(
      Number(ethers.utils.formatUnits(balanceFudPre)) +
        spillrate * fudChannelAmount
    );
  });
  it("Test transfer on channeling", async function () {
    const ownerShare = 0.8;
    const fudChannelAmount = 100;
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("1350000000")
    );
    await g.fud.transfer(
      maticDiamondAddress,
      ethers.utils.parseUnits("1350000000")
    );

    await mineBlocks(ethers, 90000);

    const balancePortalFudPre = await g.fud.balanceOf(maticDiamondAddress);
    const balanceOwnerFudPre = await g.fud.balanceOf(testAddress);
    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    const signature = await genChannelAlchemicaSignature(
      testParcelId,
      testGotchiId,
      lastChanneled
    );

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      signature
    );
    const balancePortalFudAfter = await g.fud.balanceOf(maticDiamondAddress);
    const balanceOwnerFudAfter = await g.fud.balanceOf(testAddress);

    expect(Number(ethers.utils.formatUnits(balancePortalFudAfter))).to.equal(
      Number(ethers.utils.formatUnits(balancePortalFudPre)) -
        fudChannelAmount * ownerShare
    );
    expect(Number(ethers.utils.formatUnits(balanceOwnerFudAfter))).to.equal(
      Number(ethers.utils.formatUnits(balanceOwnerFudPre)) +
        fudChannelAmount * ownerShare
    );
  });
});

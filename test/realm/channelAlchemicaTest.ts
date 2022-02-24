import {
  impersonate,
  maticDiamondAddress,
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
} from "../../scripts/realm/realmHelpers";
import { BigNumberish } from "ethers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;
  const testGotchiId2 = 23491;
  const testGotchiId3 = 19652;

  let g: TestBeforeVars;

  const genSignatureItem = async (tileId: number, x: number, y: number) => {
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

  const genSignatureChanneling = async (
    testGotchiId: number,
    lastChanneled: BigNumberish
  ) => {
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [testParcelId, testGotchiId, lastChanneled]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);
    return signature;
  };

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
    const alchemicaAddresses = [
      g.fud.address,
      g.fomo.address,
      g.alpha.address,
      g.kek.address,
    ];

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationDiamond.addInstallationTypes(testInstallations());
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
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      1,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      2,
      ethers.utils.parseUnits("30000")
    );
    await g.alchemicaFacet.testingAlchemicaFaucet(
      3,
      ethers.utils.parseUnits("30000")
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
    await g.installationDiamond.craftInstallations([4]);
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await g.installationDiamond.claimInstallations([0]);
    await g.realmFacet.equipInstallation(
      testParcelId,
      4,
      0,
      0,
      await genSignatureItem(4, 0, 0)
    );
  });
  it("Test 1 day cooldown", async function () {
    let lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      await genSignatureChanneling(testGotchiId, lastChanneled)
    );
    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId,
        lastChanneled,
        await genSignatureChanneling(testGotchiId, lastChanneled)
      )
    ).to.be.revertedWith("AlchemicaFacet: Incorrect last duration");
    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId,
        lastChanneled,
        await genSignatureChanneling(testGotchiId, lastChanneled)
      )
    ).to.be.revertedWith("AlchemicaFacet: Gotchi can't channel yet");
  });
  it("Test multiple channel cooldown based on altar level", async function () {
    let lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId2);

    await network.provider.send("evm_increaseTime", [86400]);
    await network.provider.send("evm_mine");
    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId2,
      lastChanneled,
      await genSignatureChanneling(testGotchiId2, lastChanneled)
    );
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
    for (let i = 0; i < 11000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await g.installationDiamond.finalizeUpgrade();

    await network.provider.send("evm_increaseTime", [86400]);
    await network.provider.send("evm_mine");

    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId,
      lastChanneled,
      await genSignatureChanneling(testGotchiId, lastChanneled)
    );

    await network.provider.send("evm_increaseTime", [43200]);
    await network.provider.send("evm_mine");

    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId3);

    await g.alchemicaFacet.channelAlchemica(
      testParcelId,
      testGotchiId3,
      lastChanneled,
      await genSignatureChanneling(testGotchiId3, lastChanneled)
    );

    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId2);

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId2,
        lastChanneled,
        await genSignatureChanneling(testGotchiId2, lastChanneled)
      )
    ).to.be.revertedWith("AlchemicaFacet: Parcel can't channel yet");

    lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId3);

    await expect(
      g.alchemicaFacet.channelAlchemica(
        testParcelId,
        testGotchiId3,
        lastChanneled,
        await genSignatureChanneling(testGotchiId3, lastChanneled)
      )
    ).to.be.revertedWith("AlchemicaFacet: Gotchi can't channel yet");
  });
  it("Test minting new tokens on channeling", async function () {
    const spillrate = 0.2;
    const fudChannelAmount = 100;
    const balanceFudPre = await g.fud.balanceOf(maticDiamondAddress);

    for (let i = 0; i < 90000; i++) {
      ethers.provider.send("evm_mine", []);
    }

    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [testParcelId, testGotchiId, lastChanneled]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
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
    for (let i = 0; i < 90000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePortalFudPre = await g.fud.balanceOf(maticDiamondAddress);
    const balanceOwnerFudPre = await g.fud.balanceOf(testAddress);
    const lastChanneled = await g.alchemicaFacet.getLastChanneled(testGotchiId);
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256", "uint256"],
      [testParcelId, testGotchiId, lastChanneled]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
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

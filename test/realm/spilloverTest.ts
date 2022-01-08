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

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

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
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      g.installationsAddress,
      maticDiamondAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [g.fud.address, g.fomo.address, g.alpha.address, g.kek.address],
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      g.ownerAddress
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

    await g.installationDiamond.setAlchemicaAddresses(alchemicaAddresses);
    const getAlchemicaAddresses =
      await g.installationDiamond.getAlchemicaAddresses();
    expect(alchemicaAddresses).to.eql(getAlchemicaAddresses);
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
    await g.alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("10500")
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
    await g.installationDiamond.craftInstallations([1, 2, 2]);
    await expect(
      g.installationDiamond.claimInstallations([0, 1, 2])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }

    const erc1155facet = await ethers.getContractAt(
      "ERC1155Facet",
      g.installationsAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await g.installationDiamond.claimInstallations([0, 1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
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
    await g.realmFacet.equipInstallation(testParcelId, 1, 0, 0);
    await g.realmFacet.equipInstallation(testParcelId, 2, 3, 3);
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    console.log("available alchemica", availableAlchemica);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    for (let i = 0; i < 2000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);
    availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    console.log("available alchemica", availableAlchemica);

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
  it("Claim Alchemica", async function () {
    let balance = await g.fud.balanceOf(testAddress);
    expect(Number(ethers.utils.formatUnits(balance))).to.equal(0);
    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [0, testGotchiId]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      0,
      testGotchiId,
      signature
    );
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);
    const alchemicaMinusSpillover = 0.8;
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    let claimedAlchemica = await g.fud.balanceOf(testAddress);
    expect(Number(ethers.utils.formatUnits(claimedAlchemica))).to.equal(
      alchemicaMinusSpillover *
        Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
  it("Equip level 2 and claim alchemica", async function () {
    let balance = await g.fud.balanceOf(testAddress);
    await g.realmFacet.equipInstallation(testParcelId, 2, 6, 6);
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 3,
      coordinateY: 3,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await g.installationDiamond.upgradeInstallation(upgradeQueue);
    for (let i = 0; i < 20000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await g.installationDiamond.finalizeUpgrade();
    for (let i = 0; i < 2000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await g.realmFacet.getParcelCapacity(testParcelId);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );

    //@ts-ignore
    let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [0, testGotchiId]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    await g.alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      0,
      testGotchiId,
      signature
    );

    let claimedAlchemica = await g.fud.balanceOf(testAddress);
    const alchemicaMinusSpillover = 0.85;
    expect(
      Number(ethers.utils.formatUnits(claimedAlchemica)) -
        Number(ethers.utils.formatUnits(balance))
    ).to.equal(
      alchemicaMinusSpillover *
        Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
});

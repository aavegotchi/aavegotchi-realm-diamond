import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";

import { Wallet } from "ethers";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  beforeTest,
  outputInstallation,
  testInstallations,
} from "../../scripts/realm/realmHelpers";
import { TestBeforeVars } from "../../types";
describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";

  let currentAccount: SignerWithAddress;
  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);
    const accounts = await ethers.getSigners();
    currentAccount = accounts[0];
    g = await beforeTest(ethers);
  });
  it("Deploy alchemica ERC20s", async function () {
    g.fud = await impersonate(maticDiamondAddress, g.fud, ethers, network);
    g.fomo = await impersonate(maticDiamondAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(maticDiamondAddress, g.alpha, ethers, network);
    g.kek = await impersonate(maticDiamondAddress, g.kek, ethers, network);

    await g.fud.mint(testAddress, ethers.utils.parseEther("10"));
    await g.fomo.mint(testAddress, ethers.utils.parseEther("10"));
    await g.alpha.mint(testAddress, ethers.utils.parseEther("10"));
    await g.kek.mint(testAddress, ethers.utils.parseEther("10"));

    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    //@ts-ignore
    const backendSigner: Wallet = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

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

  it("Alchemica are owned by Realm Diamond", async function () {
    const alchemicaOwner = await g.fud.owner();
    expect(alchemicaOwner).to.equal(maticDiamondAddress);
  });

  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      currentAccount.address,
      g.installationDiamond,
      ethers,
      network
    );
    const setAlchemicaAddresses = [
      g.fud.address,
      g.fomo.address,
      g.alpha.address,
      g.kek.address,
    ];
    await g.installationDiamond.setAlchemicaAddresses(setAlchemicaAddresses);
    const getAlchemicaAddresses =
      await g.installationDiamond.getAlchemicaAddresses();
    expect(setAlchemicaAddresses).to.eql(getAlchemicaAddresses);
    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationDiamond.addInstallationTypes(testInstallations());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });

  it("Can craft installations", async function () {
    g.installationDiamond = await impersonate(
      testAddress,
      g.installationDiamond,
      ethers,
      network
    );
    g.fud = await impersonate(testAddress, g.fud, ethers, network);
    g.fomo = await impersonate(testAddress, g.fomo, ethers, network);
    g.alpha = await impersonate(testAddress, g.alpha, ethers, network);
    g.kek = await impersonate(testAddress, g.kek, ethers, network);
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
    await g.installationDiamond.craftInstallations([1, 1, 2, 2]);
    await expect(
      g.installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await g.erc1155Facet.balanceOf(testAddress, 1);
    await g.installationDiamond.claimInstallations([0, 1, 2, 3]);
    const balancePost = await g.erc1155Facet.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);
  });

  it("Reverts if installation does not exist", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );
    const installation = outputInstallation({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 0,
      deprecated: false,
      nextLevelId: 1,
      prerequisites: [],
    });
    await g.installationDiamond.addInstallationTypes([installation]);

    await expect(
      g.installationDiamond.craftInstallations([5])
    ).to.be.revertedWith("InstallationFacet: Installation does not exist");
  });

  it("Crafting reverts with insufficient balance", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );
    const installation = outputInstallation({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [1000, 1000, 1000, 1000],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 0,
      deprecated: false,
      nextLevelId: 1,
      prerequisites: [],
    });
    await g.installationDiamond.addInstallationTypes([installation]);

    await expect(
      g.installationDiamond.craftInstallations([5])
    ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
  });

  it("Survey Parcel", async function () {
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    await g.alchemicaFacet.testingStartSurveying(2893);
  });
  it("Equip reservoir", async function () {
    g.realmFacet = await impersonate(
      testAddress,
      g.realmFacet,
      ethers,
      network
    );
    await g.realmFacet.equipInstallation(2893, 2, 9, 9);
  });
  // it("Equip harvester", async function () {
  //   await realmFacet.equipInstallation(2893, 1, 2, 2);
  //   const blockNumBefore = await ethers.provider.getBlockNumber();
  //   const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  //   const timestampBefore = blockBefore.timestamp;
  //   await ethers.provider.send("evm_increaseTime", [100]);
  //   await ethers.provider.send("evm_mine", []);
  //   let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(2893);
  //   expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
  //     200
  //   );

  //   //@ts-ignore
  //   const backendSigner: Wallet = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
  //   let messageHash = ethers.utils.solidityKeccak256(
  //     ["uint256", "uint256"],
  //     [0, 22306]
  //   );
  //   let signedMessage = await backendSigner.signMessage(
  //     ethers.utils.arrayify(messageHash)
  //   );
  //   let signature = ethers.utils.arrayify(signedMessage);

  //   signedMessage = await backendSigner.signMessage(messageHash);
  //   let invalidSignature = ethers.utils.arrayify(signedMessage);

  //   // check invalid signature
  //   await expect(
  //     g.alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, invalidSignature)
  //   ).to.be.revertedWith("g.AlchemicaFacet: Invalid signature");

  //   await g.alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, signature);
  //   availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(2893);
  //   expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
  // });
  // it("Equip second harvester", async function () {
  //   await realmFacet.equipInstallation(2893, 1, 14, 14);
  //   await ethers.provider.send("evm_increaseTime", [100]);
  //   await ethers.provider.send("evm_mine", []);
  //   let availableAlchemica = await g.alchemicaFacet.getAvailableAlchemica(2893);
  //   console.log(ethers.utils.formatUnits(availableAlchemica[0]));
  // });
});

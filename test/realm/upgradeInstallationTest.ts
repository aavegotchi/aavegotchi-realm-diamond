import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  AlchemicaFacet,
  RealmFacet,
  OwnershipFacet,
  AlchemicaToken,
  InstallationDiamond,
} from "../../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-upgradeInstallation";
import { UpgradeQueue } from "../../types";
import { BigNumberish } from "@ethersproject/bignumber";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const installationsAddress = "0x75139C13199A3470A0505AdBEa4f25570FFf362b";
  const installationsOwner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const alchemicaForTester = ethers.utils.parseUnits("500000");
  const testParcelId = 2893;

  let hardcodedAlchemicasTotals: any = [
    [14154, 7076, 3538, 1414],
    [56618, 28308, 14154, 5660],
    [452946, 226472, 113236, 45294],
    [452946, 226472, 113236, 45294],
    [905894, 452946, 226472, 90588],
  ];
  for (let i = 0; i < hardcodedAlchemicasTotals.length; i++) {
    for (let j = 0; j < hardcodedAlchemicasTotals[i].length; j++) {
      hardcodedAlchemicasTotals[i][j] = ethers.utils.parseUnits(
        hardcodedAlchemicasTotals[i][j].toString()
      );
    }
  }

  const greatPortalCapacity: [
    BigNumberish,
    BigNumberish,
    BigNumberish,
    BigNumberish
  ] = [
    ethers.utils.parseUnits("1250000000"),
    ethers.utils.parseUnits("625000000"),
    ethers.utils.parseUnits("312500000"),
    ethers.utils.parseUnits("125000000"),
  ];

  let alchemicaFacet: AlchemicaFacet;
  let realmFacet: RealmFacet;
  let installationDiamond: InstallationDiamond;
  let ownerAddress: string;
  let fud: AlchemicaToken;
  let fomo: AlchemicaToken;
  let alpha: AlchemicaToken;
  let kek: AlchemicaToken;

  before(async function () {
    this.timeout(20000000);
    await upgrade();

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticDiamondAddress
    )) as AlchemicaFacet;
    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    installationDiamond = (await ethers.getContractAt(
      "InstallationDiamond",
      installationsAddress
    )) as InstallationDiamond;
    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet;
    ownerAddress = await ownershipFacet.owner();
  });
  it("Deploy alchemica ERC20s", async function () {
    const Fud = await ethers.getContractFactory("AlchemicaToken");
    fud = (await Fud.deploy(
      "FUD",
      "FUD",
      ethers.utils.parseUnits("1000000000000"),
      maticDiamondAddress
    )) as AlchemicaToken;
    const Fomo = await ethers.getContractFactory("AlchemicaToken");
    fomo = (await Fomo.deploy(
      "FOMO",
      "FOMO",
      ethers.utils.parseUnits("250000000000"),
      maticDiamondAddress
    )) as AlchemicaToken;
    const Alpha = await ethers.getContractFactory("AlchemicaToken");
    alpha = (await Alpha.deploy(
      "ALPHA",
      "ALPHA",
      ethers.utils.parseUnits("125000000000"),
      maticDiamondAddress
    )) as AlchemicaToken;
    const Kek = await ethers.getContractFactory("AlchemicaToken");
    kek = (await Kek.deploy(
      "KEK",
      "KEK",
      ethers.utils.parseUnits("100000000000"),
      maticDiamondAddress
    )) as AlchemicaToken;
    console.log("fud", fud.address);
    console.log("fomo", fomo.address);
    console.log("alpha", alpha.address);
    console.log("kek", kek.address);

    await fud.transferOwnership(maticDiamondAddress);
    await fomo.transferOwnership(maticDiamondAddress);
    await alpha.transferOwnership(maticDiamondAddress);
    await kek.transferOwnership(maticDiamondAddress);

    alchemicaFacet = await impersonate(
      ownerAddress,
      alchemicaFacet,
      ethers,
      network
    );

    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await alchemicaFacet.setVars(
      hardcodedAlchemicasTotals,
      greatPortalCapacity,
      installationsAddress,
      maticDiamondAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [fud.address, fomo.address, alpha.address, kek.address],
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
    );
    await network.provider.send("hardhat_setBalance", [
      maticDiamondAddress,
      "0x1000000000000000",
    ]);
  });
  it("Setup installation diamond", async function () {
    installationDiamond = await impersonate(
      installationsOwner,
      installationDiamond,
      ethers,
      network
    );
    const setAlchemicaAddresses = [
      fud.address,
      fomo.address,
      alpha.address,
      kek.address,
    ];
    await installationDiamond.setAlchemicaAddresses(setAlchemicaAddresses);
    const getAlchemicaAddresses =
      await installationDiamond.getAlchemicaAddresses();
    expect(setAlchemicaAddresses).to.eql(getAlchemicaAddresses);
    let installationsTypes = await installationDiamond.getInstallationTypes([]);
    const installations = [];
    installations.push({
      installationType: 0,
      level: 0,
      width: 0,
      height: 0,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 0,
    });
    installations.push({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [ethers.utils.parseUnits("100"), 0, 0, 0],
      harvestRate: ethers.utils.parseUnits("2"),
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
    });
    installations.push({
      installationType: 1,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [ethers.utils.parseUnits("200"), 0, 0, 0],
      harvestRate: 0,
      capacity: ethers.utils.parseUnits("5000"),
      spillRadius: ethers.utils.parseUnits("100"),
      spillRate: ethers.utils.parseUnits("10"),
      craftTime: 20000,
    });
    installations.push({
      installationType: 1,
      level: 2,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [ethers.utils.parseUnits("400"), 0, 0, 0],
      harvestRate: 0,
      capacity: ethers.utils.parseUnits("10000"),
      spillRadius: ethers.utils.parseUnits("50"),
      spillRate: ethers.utils.parseUnits("5"),
      craftTime: 15000,
    });
    await installationDiamond.addInstallationTypes(installations);
    installationsTypes = await installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(installations.length);
  });
  it("Craft installations", async function () {
    installationDiamond = await impersonate(
      testAddress,
      installationDiamond,
      ethers,
      network
    );
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.testingAlchemicaFaucet(0, alchemicaForTester);
    await alchemicaFacet.testingAlchemicaFaucet(1, alchemicaForTester);
    await alchemicaFacet.testingAlchemicaFaucet(2, alchemicaForTester);
    await alchemicaFacet.testingAlchemicaFaucet(3, alchemicaForTester);
    fud = await impersonate(testAddress, fud, ethers, network);
    fomo = await impersonate(testAddress, fomo, ethers, network);
    alpha = await impersonate(testAddress, alpha, ethers, network);
    kek = await impersonate(testAddress, kek, ethers, network);
    fud.transfer(maticDiamondAddress, ethers.utils.parseUnits("10000"));
    await fud.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await fomo.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await alpha.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await kek.approve(
      installationsAddress,
      ethers.utils.parseUnits("1000000000")
    );
    await installationDiamond.craftInstallations([2]);
    await expect(
      installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await installationDiamond.balanceOf(testAddress, 2);
    await installationDiamond.claimInstallations([0]);
    const balancePost = await installationDiamond.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    await alchemicaFacet.testingStartSurveying(testParcelId, 0);
  });
  it("Equip reservoir", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(testParcelId, 2, 0, 0);
  });
  it("Upgrade reservoir", async function () {
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 0,
      coordinateY: 0,
      prevInstallationId: 2,
      nextInstallationId: 3,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await installationDiamond.upgradeInstallation(upgradeQueue);
    let capacityPreUpgrade = await realmFacet.getParcelCapacity(testParcelId);
    await installationDiamond.finalizeUpgrade();
    let capacityPostUpgradePreReadyBlock = await realmFacet.getParcelCapacity(
      testParcelId
    );
    expect(ethers.utils.formatUnits(capacityPreUpgrade[0])).to.equal(
      ethers.utils.formatUnits(capacityPostUpgradePreReadyBlock[0])
    );
    for (let i = 0; i < 51000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationDiamond.finalizeUpgrade();
    let capacityPostUpgradePostReadyBlock = await realmFacet.getParcelCapacity(
      testParcelId
    );
    expect(
      Number(ethers.utils.formatUnits(capacityPostUpgradePostReadyBlock[0]))
    ).to.above(Number(ethers.utils.formatUnits(capacityPreUpgrade[0])));
  });
});

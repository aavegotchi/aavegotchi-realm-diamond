import { impersonate, maticDiamondAddress } from "../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";
import {
  AlchemicaFacet,
  RealmFacet,
  OwnershipFacet,
  AlchemicaToken,
  InstallationDiamond,
} from "../typechain";
import { upgrade } from "../scripts/upgrades/upgrade-harvesting";
import { BigNumberish } from "@ethersproject/bignumber";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const installationsAddress = "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5";
  const installationsOwner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
  const alchemicaTestAmount = ethers.utils.parseUnits("100000");
  const alchemicaForTester = ethers.utils.parseUnits("50000");

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

    await fud.transferOwnership(maticDiamondAddress);
    await fomo.transferOwnership(maticDiamondAddress);
    await alpha.transferOwnership(maticDiamondAddress);
    await kek.transferOwnership(maticDiamondAddress);
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
      spillPercentage: 0,
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
      spillPercentage: 0,
      craftTime: 10000,
    });
    installations.push({
      installationType: 1,
      level: 1,
      width: 4,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [ethers.utils.parseUnits("200"), 0, 0, 0],
      harvestRate: 0,
      capacity: ethers.utils.parseUnits("5000"),
      spillRadius: ethers.utils.parseUnits("100"),
      spillPercentage: ethers.utils.parseUnits("10"),
      craftTime: 20000,
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
    fud = await impersonate(testAddress, fud, ethers, network);
    fomo = await impersonate(testAddress, fomo, ethers, network);
    alpha = await impersonate(testAddress, alpha, ethers, network);
    kek = await impersonate(testAddress, kek, ethers, network);
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
    await installationDiamond.craftInstallations([1, 1, 2, 2]);
    await expect(
      installationDiamond.claimInstallations([0])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    const balancePre = await installationDiamond.balanceOf(testAddress, 1);
    await installationDiamond.claimInstallations([0, 1, 2, 3]);
    const balancePost = await installationDiamond.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.testingStartSurveying(2893, 0);
  });
  it("Equip reservoir", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(2893, 2, 9, 9);
  });
  it("Equip harvester", async function () {
    await realmFacet.equipInstallation(2893, 1, 2, 2);
    const blockNumBefore = await ethers.provider.getBlockNumber();
    const blockBefore = await ethers.provider.getBlock(blockNumBefore);
    const timestampBefore = blockBefore.timestamp;
    await ethers.provider.send("evm_increaseTime", [100]);
    await ethers.provider.send("evm_mine", []);
    let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      200
    );

    let backendSigner = new ethers.Wallet(process.env.GBM_PK); // PK should start with '0x'
    let messageHash = ethers.utils.solidityKeccak256(
      ["uint256", "uint256"],
      [0, 22306]
    );
    let signedMessage = await backendSigner.signMessage(
      ethers.utils.arrayify(messageHash)
    );
    let signature = ethers.utils.arrayify(signedMessage);

    signedMessage = await backendSigner.signMessage(messageHash);
    let invalidSignature = ethers.utils.arrayify(signedMessage);

    // check invalid signature
    await expect(
      alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, invalidSignature)
    ).to.be.revertedWith("AlchemicaFacet: Invalid signature");

    await alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, signature);
    availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
  });
  it("Equip second harvester", async function () {
    await realmFacet.equipInstallation(2893, 1, 14, 14);
    await ethers.provider.send("evm_increaseTime", [100]);
    await ethers.provider.send("evm_mine", []);
    let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
    console.log(ethers.utils.formatUnits(availableAlchemica[0]));
  });
});

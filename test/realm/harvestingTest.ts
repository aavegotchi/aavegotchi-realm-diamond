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
  InstallationFacet,
  ERC1155Facet,
} from "../../typechain";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-harvesting";
import { BigNumberish } from "@ethersproject/bignumber";
import { Wallet } from "ethers";
import { deployDiamond } from "../../scripts/installation/deploy";

import { InstallationType } from "../../types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { boostMultipliers, greatPortalCapacity } from "../../scripts/setVars";
describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  // const installationsAddress = "0x7Cc7B6964d8C49d072422B2e7FbF55C2Ca6FefA5";
  // const installationsOwner = "0x296903b6049161bebEc75F6f391a930bdDBDbbFc";
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

  let alchemicaFacet: AlchemicaFacet;
  let realmFacet: RealmFacet;
  let installationDiamond: InstallationFacet;
  let ownerAddress: string;
  let installationsAddress: string;
  let fud: AlchemicaToken;
  let fomo: AlchemicaToken;
  let alpha: AlchemicaToken;
  let kek: AlchemicaToken;
  let erc1155Facet: ERC1155Facet;
  let currentAccount: SignerWithAddress;

  before(async function () {
    const accounts = await ethers.getSigners();
    currentAccount = accounts[0];

    this.timeout(20000000);
    await upgrade();
    installationsAddress = await deployDiamond();

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticDiamondAddress
    )) as AlchemicaFacet;
    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;
    installationDiamond = (await ethers.getContractAt(
      "InstallationFacet",
      installationsAddress
    )) as InstallationFacet;

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      installationsAddress
    )) as ERC1155Facet;

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
    //@ts-ignore
    const backendSigner: Wallet = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    await alchemicaFacet.setVars(
      hardcodedAlchemicasTotals,
      boostMultipliers,
      greatPortalCapacity,
      installationsAddress,
      maticDiamondAddress,
      "0x0000000000000000000000000000000000000000",
      "0x0000000000000000000000000000000000000000",
      [fud.address, fomo.address, alpha.address, kek.address],
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      ownerAddress
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
      currentAccount.address,
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
    const installations: InstallationType[] = [];
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
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    });
    installations.push({
      installationType: 0,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: ethers.utils.parseUnits("2"),
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
    });
    installations.push({
      installationType: 1,
      level: 1,
      width: 4,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [0, 0, 0, 0],
      harvestRate: 0,
      capacity: ethers.utils.parseUnits("5000"),
      spillRadius: ethers.utils.parseUnits("100"),
      spillRate: ethers.utils.parseUnits("10"),
      craftTime: 20000,
      deprecated: false,
      nextLevelId: 0,
      prerequisites: [],
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
    const balancePre = await erc1155Facet.balanceOf(testAddress, 1);
    await installationDiamond.claimInstallations([0, 1, 2, 3]);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 1);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.testingStartSurveying(2893);
  });
  it("Equip reservoir", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(2893, 2, 9, 9);
  });
  // it("Equip harvester", async function () {
  //   await realmFacet.equipInstallation(2893, 1, 2, 2);
  //   const blockNumBefore = await ethers.provider.getBlockNumber();
  //   const blockBefore = await ethers.provider.getBlock(blockNumBefore);
  //   const timestampBefore = blockBefore.timestamp;
  //   await ethers.provider.send("evm_increaseTime", [100]);
  //   await ethers.provider.send("evm_mine", []);
  //   let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
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
  //     alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, invalidSignature)
  //   ).to.be.revertedWith("AlchemicaFacet: Invalid signature");

  //   await alchemicaFacet.claimAvailableAlchemica(2893, 0, 22306, signature);
  //   availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
  //   expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
  // });
  // it("Equip second harvester", async function () {
  //   await realmFacet.equipInstallation(2893, 1, 14, 14);
  //   await ethers.provider.send("evm_increaseTime", [100]);
  //   await ethers.provider.send("evm_mine", []);
  //   let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(2893);
  //   console.log(ethers.utils.formatUnits(availableAlchemica[0]));
  // });
});

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
} from "../../typechain";
import { upgrade } from "../../scripts/realm/upgrades/upgrade-harvesting";
import { UpgradeQueue } from "../../types";
import { deployDiamond } from "../../scripts/installation/deploy";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import { testInstallations } from "../../scripts/realm/realmHelpers";

describe("Testing Equip Installation", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";
  const testParcelId = 2893;
  const testGotchiId = 22306;

  let alchemicaFacet: AlchemicaFacet;
  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;
  let installationsOwner: string;
  let ownerAddress: string;
  let fud: AlchemicaToken;
  let fomo: AlchemicaToken;
  let alpha: AlchemicaToken;
  let kek: AlchemicaToken;
  let installationsAddress: string;

  before(async function () {
    this.timeout(20000000);
    installationsAddress = await deployDiamond();
    await upgrade(installationsAddress);

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticDiamondAddress
    )) as AlchemicaFacet;
    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      maticDiamondAddress
    )) as RealmFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      installationsAddress
    )) as InstallationFacet;

    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      maticDiamondAddress
    )) as OwnershipFacet;
    ownerAddress = await ownershipFacet.owner();

    const installationOwner = (await ethers.getContractAt(
      "OwnershipFacet",
      installationsAddress
    )) as OwnershipFacet;
    const owner = await installationOwner.owner();
    installationsOwner = owner;
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
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
    await alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
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
  });
  it("Setup installation diamond", async function () {
    installationFacet = await impersonate(
      installationsOwner,
      installationFacet,
      ethers,
      network
    );
    const alchemicaAddresses = [
      fud.address,
      fomo.address,
      alpha.address,
      kek.address,
    ];

    await installationFacet.setAlchemicaAddresses(alchemicaAddresses);
    const getAlchemicaAddresses =
      await installationFacet.getAlchemicaAddresses();
    expect(alchemicaAddresses).to.eql(getAlchemicaAddresses);
    let installationsTypes = await installationFacet.getInstallationTypes([]);

    await installationFacet.addInstallationTypes(testInstallations());
    installationsTypes = await installationFacet.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });
  it("Craft installations", async function () {
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.testingAlchemicaFaucet(
      0,
      ethers.utils.parseUnits("10500")
    );
    await alchemicaFacet.testingAlchemicaFaucet(
      1,
      ethers.utils.parseUnits("300")
    );
    await alchemicaFacet.testingAlchemicaFaucet(
      2,
      ethers.utils.parseUnits("300")
    );
    await alchemicaFacet.testingAlchemicaFaucet(
      3,
      ethers.utils.parseUnits("300")
    );
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
    await installationFacet.craftInstallations([1, 2, 2]);
    await expect(
      installationFacet.claimInstallations([0, 1, 2])
    ).to.be.revertedWith("InstallationFacet: installation not ready");
    for (let i = 0; i < 21000; i++) {
      ethers.provider.send("evm_mine", []);
    }

    const erc1155facet = await ethers.getContractAt(
      "ERC1155Facet",
      installationsAddress
    );

    const balancePre = await erc1155facet.balanceOf(testAddress, 2);
    await installationFacet.claimInstallations([0, 1, 2]);
    const balancePost = await erc1155facet.balanceOf(testAddress, 2);
    expect(balancePost).to.above(balancePre);
  });
  it("Survey Parcel", async function () {
    await alchemicaFacet.testingStartSurveying(testParcelId);
  });
  it("Equip installations", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(testParcelId, 1, 0, 0);
    await realmFacet.equipInstallation(testParcelId, 2, 3, 3);
    let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );

    console.log("available alchemica", availableAlchemica);
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    for (let i = 0; i < 2000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    let parcelCapacity = await realmFacet.getParcelCapacity(testParcelId);
    availableAlchemica = await alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    console.log("available alchemica", availableAlchemica);

    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(
      Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
  it("Claim Alchemica", async function () {
    let balance = await fud.balanceOf(testAddress);
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
    await alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      0,
      testGotchiId,
      signature
    );
    let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await realmFacet.getParcelCapacity(testParcelId);
    const alchemicaMinusSpillover = 0.8;
    expect(Number(ethers.utils.formatUnits(availableAlchemica[0]))).to.equal(0);
    let claimedAlchemica = await fud.balanceOf(testAddress);
    expect(Number(ethers.utils.formatUnits(claimedAlchemica))).to.equal(
      alchemicaMinusSpillover *
        Number(ethers.utils.formatUnits(parcelCapacity[0]))
    );
  });
  it("Equip level 2 and claim alchemica", async function () {
    let balance = await fud.balanceOf(testAddress);
    await realmFacet.equipInstallation(testParcelId, 2, 6, 6);
    const upgradeQueue: UpgradeQueue = {
      parcelId: testParcelId,
      coordinateX: 3,
      coordinateY: 3,
      installationId: 2,
      readyBlock: 0,
      claimed: false,
      owner: testAddress,
    };
    await installationFacet.upgradeInstallation(upgradeQueue);
    for (let i = 0; i < 20000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    await installationFacet.finalizeUpgrade();
    for (let i = 0; i < 2000; i++) {
      ethers.provider.send("evm_mine", []);
    }
    let availableAlchemica = await alchemicaFacet.getAvailableAlchemica(
      testParcelId
    );
    let parcelCapacity = await realmFacet.getParcelCapacity(testParcelId);
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
    await alchemicaFacet.claimAvailableAlchemica(
      testParcelId,
      0,
      testGotchiId,
      signature
    );

    let claimedAlchemica = await fud.balanceOf(testAddress);
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

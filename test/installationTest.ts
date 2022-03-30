import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  mineBlocks,
  pixelcraftAddress,
} from "../scripts/helperFunctions";
import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  AlchemicaToken,
} from "../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { deployDiamond } from "../scripts/installation/deploy";
import { BigNumber, Signer } from "ethers";
import {
  maticGhstAddress,
  maticRealmDiamondAddress,
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../scripts/installation/helperFunctions";
import { InstallationTypeInput } from "../types";

describe("Installations tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  const testAddress2 = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let diamondAddress: string;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let accounts: Signer[];
  const testParcelId = "141";

  before(async function () {
    this.timeout(20000000);
    diamondAddress = await deployDiamond();
    accounts = await ethers.getSigners();

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      diamondAddress
    )) as InstallationFacet;

    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      diamondAddress
    )) as InstallationAdminFacet;

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;
  });

  it("Set Diamond Addresses", async function () {
    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    await installationAdminFacet.setAddresses(
      maticAavegotchiDiamondAddress,
      maticRealmDiamondAddress,
      ethers.constants.AddressZero, //replace
      pixelcraftAddress,
      aavegotchiDAOAddress
    );
  });

  it("Add installation types", async function () {
    let installationsTypes = await installationFacet.getInstallationTypes([]);
    const installations: InstallationTypeInput[] = [];
    installations.push({
      deprecated: false,
      upgradeQueueBoost: 0,
      installationType: 0,
      level: 1,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
        ethers.utils.parseEther("100"),
      ],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 2,
      name: "rando",
    });

    installations.push({
      deprecated: false,
      upgradeQueueBoost: 0,
      name: "rando",
      installationType: 0,
      level: 1,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(0),
        BigNumber.from(3),
      ],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 2,
    });

    installations.push({
      deprecated: false,
      installationType: 0,
      upgradeQueueBoost: 0,
      name: "rando",
      level: 2,
      width: 2,
      height: 4,
      alchemicaType: 0,
      alchemicaCost: [
        BigNumber.from(1),
        BigNumber.from(2),
        BigNumber.from(0),
        BigNumber.from(3),
      ],
      harvestRate: 2,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 10000,
      prerequisites: [],
      nextLevelId: 3,
    });

    await installationAdminFacet.addInstallationTypes(installations);
    installationsTypes = await installationFacet.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(installations.length);
  });

  it("Craft ID=0 installations with Test Address", async function () {
    ghst = await impersonate(testAddress, ghst, ethers, network);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );

    await faucetRealAlchemica(testAddress, ethers);

    await approveRealAlchemica(testAddress, diamondAddress, ethers);

    await ghst.approve(
      installationFacet.address,
      ethers.utils.parseUnits("1000000000")
    );

    const fud = "0x403E967b044d4Be25170310157cB1A4Bf10bdD0f";

    const fudToken = (await ethers.getContractAt(
      "AlchemicaToken",
      fud
    )) as AlchemicaToken;
    let fudBalanceBefore = await fudToken.balanceOf(testAddress);

    await installationFacet.craftInstallations([0, 0, 0, 0, 0]);
    await expect(installationFacet.claimInstallations([0])).to.be.revertedWith(
      "InstallationFacet: Installation not ready"
    );

    let fudBalanceAfter = await fudToken.balanceOf(testAddress);
    //five installations were crafted, each 100
    expect(fudBalanceAfter).to.equal(
      fudBalanceBefore.sub(ethers.utils.parseEther("500"))
    );

    //30% of 500 is 150 for Pixelcraft
    const pixelcraftFudBalance = await fudToken.balanceOf(pixelcraftAddress);
    expect(pixelcraftFudBalance).to.equal(ethers.utils.parseEther("150"));

    //30% of 500 is 150 for DAO
    const daoBalance = await fudToken.balanceOf(aavegotchiDAOAddress);
    expect(daoBalance).to.equal(ethers.utils.parseEther("150"));

    await mineBlocks(ethers, 11000);

    //Claimed five installations
    await installationFacet.claimInstallations([0, 1, 2, 3, 4]);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    expect(balancePost).to.eq(5);
  });
  it("Transfer ID=0 installation from Test address to Test Address 2", async function () {
    erc1155Facet = await impersonate(
      testAddress,
      erc1155Facet,
      ethers,
      network
    );

    const balancePre = await erc1155Facet.balanceOf(testAddress, 0);
    const balancePre2 = await erc1155Facet.balanceOf(testAddress2, 0);
    expect(balancePre).to.gt(balancePre2);

    await erc1155Facet.safeTransferFrom(testAddress, testAddress2, 0, 3, []);
    const balancePost = await erc1155Facet.balanceOf(testAddress, 0);
    const balancePost2 = await erc1155Facet.balanceOf(testAddress2, 0);
    expect(balancePost2).to.gt(balancePost);
  });
  it("Batch transfer ID=1 installations from test address to test address 2", async function () {
    this.timeout(20000000);
    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );
    erc1155Facet = await impersonate(
      testAddress,
      erc1155Facet,
      ethers,
      network
    );
    await installationFacet.craftInstallations([1, 1, 1, 1]);

    await mineBlocks(ethers, 51000);

    await installationFacet.claimInstallations([5, 6, 7, 8]);
    const balancePreHarv = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 0),
      0
    );
    const balancePreHarv2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 0),
      0
    );
    const balancePreRes = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 1),
      0
    );
    const balancePreRes2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 1),
      0
    );
    await erc1155Facet.safeBatchTransferFrom(
      testAddress,
      testAddress2,
      [0, 1],
      [2, 3],
      []
    );
    const balancePostHarv = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 0),
      0
    );
    const balancePostHarv2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 0),
      0
    );
    const balancePostRes = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress, 1),
      0
    );
    const balancePostRes2 = ethers.utils.formatUnits(
      await erc1155Facet.balanceOf(testAddress2, 1),
      0
    );
    expect(Number(balancePreHarv) + Number(balancePreHarv2)).to.equal(
      Number(balancePostHarv) + Number(balancePostHarv2)
    );
    expect(Number(balancePreRes) + Number(balancePreRes2)).to.equal(
      Number(balancePostRes) + Number(balancePostRes2)
    );
  });

  it("Only owner can deprecate installation", async function () {
    installationAdminFacet = await impersonate(
      testAddress,
      installationAdminFacet,
      ethers,
      network
    );
    await expect(
      installationAdminFacet.deprecateInstallations(["1"])
    ).to.be.revertedWith("LibDiamond: Must be contract owner");

    installationAdminFacet = await impersonate(
      await accounts[0].getAddress(),
      installationAdminFacet,
      ethers,
      network
    );

    await installationAdminFacet.deprecateInstallations(["1"]);

    installationFacet = await impersonate(
      await accounts[0].getAddress(),
      installationFacet,
      ethers,
      network
    );

    await expect(
      installationFacet.craftInstallations(["1"])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");
  });
});

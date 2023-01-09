import {
  aavegotchiDAOAddress,
  impersonate,
  maticAavegotchiDiamondAddress,
  pixelcraftAddress,
} from "../../scripts/helperFunctions";
import {
  InstallationFacet,
  ERC1155Facet,
  IERC20,
  InstallationAdminFacet,
  OwnershipFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-addDeprecateTimeToAddInstallationTypes";
import { BigNumber, BigNumberish } from "ethers";
import { maticGhstAddress } from "../../scripts/installation/helperFunctions";
import {
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../../scripts/realm/realmHelpers";
import { maticVars } from "../../constants";

describe("Installations deprecation time tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";
  let diamondAddress: string;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let erc1155Facet: ERC1155Facet;
  let ghst: IERC20;
  let startInstallationId: number;

  before(async function () {
    this.timeout(20000000);

    await upgrade();

    diamondAddress = maticVars.installationDiamond;

    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;
    const owner = await ownershipFacet.owner();

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      diamondAddress
    )) as InstallationFacet;

    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      diamondAddress
    )) as InstallationAdminFacet;
    installationAdminFacet = await impersonate(
      owner,
      installationAdminFacet,
      ethers,
      network
    );

    erc1155Facet = (await ethers.getContractAt(
      "ERC1155Facet",
      diamondAddress
    )) as ERC1155Facet;

    console.log("diamond address:", diamondAddress);

    ghst = (await ethers.getContractAt(
      "contracts/interfaces/IERC20.sol:IERC20",
      maticGhstAddress
    )) as IERC20;

    //@ts-ignore
    const backendSigner = new ethers.Wallet(process.env.GBM_PK); // PK should start with '0x'

    await installationAdminFacet.setAddresses(
      maticAavegotchiDiamondAddress,
      maticVars.realmDiamond,
      ethers.constants.AddressZero, //replace
      pixelcraftAddress,
      aavegotchiDAOAddress,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1)
    );
  });

  it("Should emit EditDeprecateTime when add installation types with deprecateTime", async function () {
    const oldInstallationsTypes = await installationFacet.getInstallationTypes(
      []
    );
    startInstallationId = oldInstallationsTypes.length;

    const installations = [
      {
        deprecated: false,
        upgradeQueueBoost: 0,
        installationType: 8,
        level: 1,
        width: 2,
        height: 4,
        alchemicaType: 0,
        alchemicaCost: [
          BigNumber.from(1),
          BigNumber.from(2),
          BigNumber.from(0),
          BigNumber.from(3),
        ] as [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
        harvestRate: 2,
        capacity: 0,
        spillRadius: 0,
        spillRate: 0,
        craftTime: 10000,
        prerequisites: [],
        nextLevelId: 2,
        name: "rando",
        unequipType: 0,
        deprecateTime: 1669881600, // 2022-12-01
      },
      {
        deprecated: false,
        upgradeQueueBoost: 0,
        name: "rando",
        installationType: 8,
        level: 1,
        width: 2,
        height: 4,
        alchemicaType: 0,
        alchemicaCost: [
          BigNumber.from(1),
          BigNumber.from(2),
          BigNumber.from(0),
          BigNumber.from(3),
        ] as [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
        harvestRate: 2,
        capacity: 0,
        spillRadius: 0,
        spillRate: 0,
        craftTime: 10000,
        prerequisites: [],
        nextLevelId: 2,
        unequipType: 0,
        deprecateTime: 1701417600, // 2023-12-01
      },
      {
        deprecated: false,
        installationType: 8,
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
        ] as [BigNumberish, BigNumberish, BigNumberish, BigNumberish],
        harvestRate: 2,
        capacity: 0,
        spillRadius: 0,
        spillRate: 0,
        craftTime: 10000,
        prerequisites: [],
        nextLevelId: 3,
        unequipType: 0,
        deprecateTime: 0,
      },
    ];

    const receipt = await (
      await installationAdminFacet.addInstallationTypes(installations)
    ).wait();
    const events = receipt!.events!.filter(
      (event) => event.event === "EditDeprecateTime"
    );
    expect(events.length).to.equal(2);

    const installationsTypes = await installationFacet.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(
      installations.length + oldInstallationsTypes.length
    );
  });

  it("Should revert when craft installation whose deprecation time set", async function () {
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

    await expect(
      installationFacet.craftInstallations([startInstallationId], [1000])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");
  });
});

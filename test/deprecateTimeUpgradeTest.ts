import { impersonate } from "../scripts/helperFunctions";
import {
  RealmFacet,
  ERC721Facet,
  OwnershipFacet,
  InstallationFacet,
  InstallationAdminFacet,
} from "../typechain";
import { expect } from "chai";
import { network } from "hardhat";
import { ethers } from "hardhat";
import {
  approveRealAlchemica,
  faucetRealAlchemica,
} from "../scripts/helperFunctions";
import { upgrade } from "../scripts/installation/upgrades/upgrade-deprecateTime";

let diamondAddress: string;
let installationAddress: string;
let realmFacet: RealmFacet;
let installationFacet: InstallationFacet;
let installationAdminFacet: InstallationAdminFacet;
let erc721Facet: ERC721Facet;
let ownershipFacet: OwnershipFacet;
let ownerAddress: string;
let period: number;
let date: number;

describe("Realm Upgrade tests", async function () {
  const testAddress = "0xf3678737dC45092dBb3fc1f49D89e3950Abb866d";

  before(async function () {
    this.timeout(20000000);
    // await upgrade();
    diamondAddress = "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11";
    installationAddress = "0x19f870bD94A34b3adAa9CaA439d333DA18d6812A";

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      diamondAddress
    )) as RealmFacet;
    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      installationAddress
    )) as InstallationFacet;
    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      installationAddress
    )) as InstallationAdminFacet;
    erc721Facet = (await ethers.getContractAt(
      "ERC721Facet",
      diamondAddress
    )) as ERC721Facet;
    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      diamondAddress
    )) as OwnershipFacet;

    ownerAddress = await ownershipFacet.owner();
  });

  it("Token symbol should be REALM", async function () {
    const symbol = await erc721Facet.symbol();
    expect(symbol).to.equal("REALM");
  });
  it("Token name should be Gotchiverse REALM Parcel", async function () {
    const name = await erc721Facet.name();
    expect(name).to.equal("Gotchiverse REALM Parcel");
  });
  it("Token metadata url should be https://app.aavegotchi.com/metadata/realm/0", async function () {
    const uri = await erc721Facet.tokenURI("0");
    expect(uri).to.equal("https://app.aavegotchi.com/metadata/realm/0");
  });

  it("Max supply should be 420,069", async function () {
    const maxSupply = await realmFacet.maxSupply();
    expect(maxSupply).to.equal(420069);
  });
  it("Test editDeprecateTime", async function () {
    await faucetRealAlchemica(testAddress, ethers, network);

    await approveRealAlchemica(
      testAddress,
      installationAddress,
      ethers,
      network
    );

    installationFacet = await impersonate(
      testAddress,
      installationFacet,
      ethers,
      network
    );

    await installationFacet.craftInstallations([10], [0]);

    installationAdminFacet = await impersonate(
      ownerAddress,
      installationAdminFacet,
      ethers,
      network
    );
    await installationAdminFacet.editDeprecateTime(10, 1655594972);

    period = 10 * 86400;

    await ethers.provider.send("evm_increaseTime", [period]);
    await ethers.provider.send("evm_mine", []);

    await expect(
      installationFacet.craftInstallations([10], [0])
    ).to.be.revertedWith("InstallationFacet: Installation has been deprecated");
  });
});

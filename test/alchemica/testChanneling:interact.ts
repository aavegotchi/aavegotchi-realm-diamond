import { ethers } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { upgrade } from "../../scripts/alchemica/upgrades/upgrade-Channeling:interact";
import {
  alchemica,
  maticAavegotchiDiamondAddress,
  maticInstallationDiamondAddress,
  maticRealmDiamondAddress,
  maticTileDiamondAddress,
} from "../../constants";
import { AlchemicaFacet, OwnershipFacet } from "../../typechain";
import {
  fastForward,
  impersonateAs,
  setTimestamp,
} from "../../lib/chainlink/contracts/test/test-helpers/helpers";
import {
  alchemicaTotals,
  boostMultipliers,
  greatPortalCapacity,
} from "../../scripts/setVars";
import {
  impersonate,
  installationDiamondAddress,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { genChannelAlchemicaSignature } from "../../scripts/realm/realmHelpers";
import { assert, expect } from "chai";

describe("Interact while channeling", function () {
  let signer: Signer;
  let aFacet: AlchemicaFacet;
  let aGameFacet;
  let prevKinship: BigNumber;
  let backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'
  before(async function () {
    const abi = [
      " function kinship(uint256 _tokenId) external view returns (uint256 score_)",
    ];
    aGameFacet = await ethers.getContractAt(abi, maticAavegotchiDiamondAddress);

    const ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      "0x1D0360BaC7299C86Ec8E99d0c1C9A95FEfaF2a11"
    )) as OwnershipFacet;
    const owner = await ownershipFacet.owner();

    // await impersonateAs("0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce");

    //upgrade diamond
    await upgrade();

    aFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticRealmDiamondAddress
    )) as AlchemicaFacet;

    signer = await ethers.getSigner(owner);
    await impersonateAs(owner);
    await aFacet.connect(signer).setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      maticInstallationDiamondAddress,
      "0x7a1BaC17Ccc5b313516C5E16fb24f7659aA5ebed",
      "0x326C977E6efc84E512bB9C30f76E30c160eD06FB",
      alchemica,
      ethers.constants.AddressZero,
      ethers.utils.hexDataSlice(backendSigner.publicKey, 1),
      ethers.constants.AddressZero,
      maticTileDiamondAddress,
      maticAavegotchiDiamondAddress
    );
  });

  it("should interact while channeling", async function () {
    //channel
    //generate sig
    const sig = await genChannelAlchemicaSignature(
      25355,
      3410,
      BigNumber.from(1653388974)
    );

    await impersonateAs("0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce");
    signer = await ethers.getSigner(
      "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce"
    );
    await fastForward(43200);
    prevKinship = await aGameFacet.kinship("3410");
    console.log("previous kinship:", prevKinship.toString());
    await aFacet
      .connect(signer)
      .channelAlchemica(25355, 3410, BigNumber.from(1653388974), sig);

    const afterKinship: BigNumber = await aGameFacet.kinship("3410");
    console.log("After kinship:", afterKinship.toString());
    expect(afterKinship).to.be.equal(prevKinship.add(1));
  });
});

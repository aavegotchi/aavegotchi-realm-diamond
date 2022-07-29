import { impersonate, mineBlocks } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { expect } from "chai";

import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

import {
  genEquipInstallationSignature,
  outputInstallation,
} from "../../scripts/realm/realmHelpers";
import { TestBeforeVars } from "../../types";
import { deployFarmRelease } from "../../scripts/realm/deploy/farmRelease";
import { Constants, varsForNetwork } from "../../constants";
import { AlchemicaFacet, RealmFacet } from "../../typechain";
describe("Testing Harvester Release", async function () {
  const testAddress = "0xC99DF6B7A5130Dce61bA98614A2457DAA8d92d1c";

  let currentAccount: SignerWithAddress;
  let alchemicaFacet: AlchemicaFacet;
  let realmFacet: RealmFacet;
  let c: Constants;

  before(async function () {
    c = await varsForNetwork(ethers);

    this.timeout(20000000);
    const accounts = await ethers.getSigners();
    currentAccount = accounts[0];

    await deployFarmRelease();
  });

  it("Survey Parcel", async function () {
    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      c.realmDiamond
    )) as AlchemicaFacet;

    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    await alchemicaFacet.startSurveying(2893);
  });
  it("Equip reservoir", async function () {
    realmFacet = await impersonate(testAddress, realmFacet, ethers, network);
    await realmFacet.equipInstallation(2893, 0, 2, 9, 9);
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

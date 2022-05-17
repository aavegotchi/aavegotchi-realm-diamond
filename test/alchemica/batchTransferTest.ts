import {
  impersonate,
  maticDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { BigNumber, Signer } from "ethers";
import { expect } from "chai";
import { RealmFacet } from "../../typechain";

import { MintParcelInput, TestBeforeVars } from "../../types";
import { BigNumberish } from "ethers";
import { beforeTest } from "../../scripts/realm/realmHelpers";


describe("Testing Batch Alchemica Transfers", async function () {
  const testAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5";
  let g: TestBeforeVars;
  let signers: Signer[];

  before(async function () {
    this.timeout(20000000);
    signers = await ethers.getSigners();
    signers = signers.slice(1, signers.length < 10 ? signers.length : 10);
    g = await beforeTest(ethers, maticDiamondAddress);
    g.alchemicaFacet = await impersonate(
      testAddress,
      g.alchemicaFacet,
      ethers,
      network
    );

    // Minting each alchemica
    for(let i = 0; i < 4; i++) {
      await g.alchemicaFacet.testingAlchemicaFaucet(i, BigNumber.from(1e9));
    }
  });

  
  it("Test batch transfers", async function () {
    this.timeout(20000000);
    await g.fud.connect(g.alchemicaFacet.signer).approve(g.alchemicaFacet.address, BigNumber.from(1e9));
    await g.fomo.connect(g.alchemicaFacet.signer).approve(g.alchemicaFacet.address, BigNumber.from(1e9));
    await g.alpha.connect(g.alchemicaFacet.signer).approve(g.alchemicaFacet.address, BigNumber.from(1e9));
    await g.kek.connect(g.alchemicaFacet.signer).approve(g.alchemicaFacet.address, BigNumber.from(1e9));

    let a = BigNumber.from(10);
    let targets = await Promise.all(signers.map((signer) => signer.getAddress()));
    let amounts: [BigNumber, BigNumber, BigNumber, BigNumber][] = [];
    for(let i = 0; i < targets.length; i++) {
      amounts.push([BigNumber.from(i * 4 + 1), BigNumber.from(i * 4 + 2), BigNumber.from(i * 4 + 3), BigNumber.from(i * 4 + 4)]);
    }
    let batchTransfer = await g.alchemicaFacet.batchTransferAlchemica(targets, amounts);
    for(let i = 0; i < targets.length; i++) {
      expect(await g.fud.balanceOf(targets[i])).to.be.equal(BigNumber.from(i * 4 + 1));
      expect(await g.fomo.balanceOf(targets[i])).to.be.equal(BigNumber.from(i * 4 + 2));
      expect(await g.alpha.balanceOf(targets[i])).to.be.equal(BigNumber.from(i * 4 + 3));
      expect(await g.kek.balanceOf(targets[i])).to.be.equal(BigNumber.from(i * 4 + 4));
    }
  });

});
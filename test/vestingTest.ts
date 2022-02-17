import * as fs from "fs";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { 
  Signer, 
  Contract, 
  ContractFactory,
  BigNumber } from "ethers";
import { expect } from "chai";
import {
  deployVestingContract,
  increaseTime,
  mine,
  currentTimestamp,
} from "../helpers/helpers";
import {
  GWEI,
  ETHER,
  YEAR,
} from "../helpers/constants";

describe("Vesting", function () {

  const FUD_MAX_SUPPLY = BigNumber.from("100000000000").mul(ETHER);
  let signers: Signer[];
  let owner: Signer;
  let beneficiary: Signer;
  let dao: Signer;
  let token: Contract;
  let vestingContract: Contract;
  let startTime: BigNumber;

  before(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    beneficiary = signers[1];
    dao = signers[2];
    let tokenFactory = await ethers.getContractFactory("Token");
    token = await tokenFactory.deploy();
    await token.deployed();
  });

  describe("Nonrevocable Vesting Contract", function () {
    it("Should deploy an unrevocable vesting contract and deposit some tokens", async () => {
      vestingContract = await deployVestingContract(
        owner,
        beneficiary,
        BigNumber.from("0"),
        ETHER.div(5),
        false,
      );
      expect(await vestingContract.beneficiary()).to.equal(await beneficiary.getAddress());
      expect(await vestingContract.revocable()).to.equal(false);
      expect(await vestingContract.released(token.address)).to.equal(BigNumber.from("0"));
  
      expect(await vestingContract.releasableAmount(token.address)).to.equal(BigNumber.from("0"));
      await token.connect(owner).mint(vestingContract.address, ETHER);
      expect(await token.balanceOf(vestingContract.address)).to.equal(ETHER);
    });


    it("Should release ~10% of the tokens in the first six months", async () => { 
      await increaseTime(YEAR / 2);
      await mine();
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(ETHER.div(10).sub(GWEI.mul(1000)));
      expect(await vestingContract.releasableAmount(token.address)).to.be.lt(ETHER.div(10).add(GWEI.mul(1000)));
    });

    it("Should release ~20% of the tokens after the first year", async() => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(ETHER.div(5).sub(GWEI.mul(1000)));
      expect(await vestingContract.releasableAmount(token.address)).to.be.lt(ETHER.div(5).add(GWEI.mul(1000)));
    });

    it("Should release ~28% of the tokens after 18 months", async() => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(ETHER.mul(28).div(100).sub(GWEI.mul(1000)));
      expect(await vestingContract.releasableAmount(token.address)).to.be.lt(ETHER.mul(28).div(100).add(GWEI.mul(1000)));
    });

    it("Should release ~36% of the tokens after 24 months", async() => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(ETHER.mul(36).div(100).sub(GWEI.mul(1000)));
      expect(await vestingContract.releasableAmount(token.address)).to.be.lt(ETHER.mul(36).div(100).add(GWEI.mul(1000)));
    });

    it("Releasable amount should strictly increase over time", async() => {
      let startTime = await vestingContract.start();
      // Testing for 20 years
      for(let i = 0; i < 240; i++) {
        let prevReleasable = await vestingContract.releasableAmount(token.address);
        await increaseTime(YEAR / 12);
        await mine();
        expect(await vestingContract.releasableAmount(token.address)).to.be.gt(prevReleasable);
      }
    });

    it("Should do a partial release.", async() => {
      await increaseTime(YEAR / 2);
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(BigNumber.from("0"));
      await vestingContract.partialRelease(token.address, GWEI);
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(GWEI);
      await token.burn(await beneficiary.getAddress(), await token.balanceOf(await beneficiary.getAddress()));
    });

    it("Should release the rest of the tokens", async () => {
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(BigNumber.from("0"));
      let releasableAmount = await vestingContract.releasableAmount(token.address);
      await vestingContract.release(token.address);
      expect(await token.balanceOf(await beneficiary.getAddress())).to.be.gt(releasableAmount.sub(GWEI.mul(1000)));
      expect(await token.balanceOf(await beneficiary.getAddress())).to.be.lt(releasableAmount.add(GWEI.mul(1000)));
      await token.burn(await beneficiary.getAddress(), await token.balanceOf(await beneficiary.getAddress()));
    });
  
    it("Deposit more tokens. More tokens should release.", async() => {
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(BigNumber.from("0"));
      await token.connect(owner).mint(vestingContract.address, ETHER);
      await vestingContract.release(token.address);
      expect(await token.balanceOf(beneficiary.getAddress())).to.be.gt(GWEI.mul(1000000));
    });

  });

  describe("Revocable Vesting Contract", function () {
    it("Should deploy a revocable vesting contract and deposit some tokens", async () => {
      // Reset the beneficiary's token balance
      await token.connect(owner).burn(
        await beneficiary.getAddress(), 
        await token.balanceOf(await beneficiary.getAddress()));
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(BigNumber.from(0));

      vestingContract = await deployVestingContract(
        owner,
        beneficiary,
        BigNumber.from("0"),
        BigNumber.from("2000"),
        true,
      );
      expect(await vestingContract.beneficiary()).to.equal(await beneficiary.getAddress());
      expect(await vestingContract.revocable()).to.equal(true);
      expect(await vestingContract.released(token.address)).to.equal(BigNumber.from(0));
  
      await token.connect(owner).mint(vestingContract.address, ETHER);
      expect(await token.balanceOf(vestingContract.address)).to.equal(ETHER);
      expect(await vestingContract.releasableAmount(token.address)).to.equal(BigNumber.from(0));
    });

    it("Time passes after cliff. Owner revokes. Beneficiary gets vested tokens. Vesting contract holds no more tokens. Owner receives the rest.", async() => {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      await increaseTime(20000);
      await vestingContract.connect(owner).revoke(token.address);
      expect(await token.balanceOf(vestingContract.address)).to.be.gt(BigNumber.from(0));
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(BigNumber.from(0));
      await vestingContract.release(token.address);
      await mine();
      expect(await token.balanceOf(vestingContract.address)).to.equal(BigNumber.from(0));
      expect(await token.balanceOf(await beneficiary.getAddress())).to.be.gt(BigNumber.from(0));
      expect(await token.balanceOf(await owner.getAddress())).to.be.gt(ownerBalance);
    });

  });

  describe("Alchemica", function () {
    let gameplayVestingContract: Contract;
    let ecosystemVestingContract: Contract;
    let fud: Contract;
    let alpha: Contract;
    it("Should deploy vesting contracts and successfully deploy an alchemica balance to each on alchemica construction", async () => {
      gameplayVestingContract = await deployVestingContract(
        owner,
        beneficiary,
        BigNumber.from("0"),
        ETHER.div(5),
        false,
      );
      ecosystemVestingContract = await deployVestingContract(
        owner,
        dao,
        BigNumber.from("0"),
        ETHER.div(5),
        false,
      );
      const AlchemicaToken = await hre.ethers.getContractFactory("AlchemicaToken");
      fud = await AlchemicaToken.deploy(
        "FUD", 
        "FUD", 
        ETHER, 
        await beneficiary.getAddress(), 
        gameplayVestingContract.address,
        ecosystemVestingContract.address,
      );
      expect(await fud.balanceOf(gameplayVestingContract.address)).to.equal(ETHER.div(10));
      expect(await fud.balanceOf(ecosystemVestingContract.address)).to.equal(ETHER.div(10));
    });

    it("Should allow alchemica releases from multiple alchemica tokens", async() => {
      const AlchemicaToken = await hre.ethers.getContractFactory("AlchemicaToken");
      alpha = await AlchemicaToken.deploy(
        "ALPHA", 
        "ALPHA", 
        ETHER.mul(100), 
        await beneficiary.getAddress(), 
        gameplayVestingContract.address,
        ecosystemVestingContract.address,
      );
      await increaseTime(YEAR);
      await gameplayVestingContract.release(alpha.address);
      await gameplayVestingContract.release(fud.address);
      await ecosystemVestingContract.release(alpha.address);
      await ecosystemVestingContract.release(fud.address);
      expect(await alpha.balanceOf(await dao.getAddress())).to.be.gt(0);
      expect(await fud.balanceOf(await dao.getAddress())).to.be.gt(0);
      expect(await alpha.balanceOf(await beneficiary.getAddress())).to.be.gt(0);
      expect(await fud.balanceOf(await beneficiary.getAddress())).to.be.gt(0);
    });
  });
});

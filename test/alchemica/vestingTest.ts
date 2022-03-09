import { ethers } from "hardhat";
import { Signer, Contract, BigNumber } from "ethers";
import { expect } from "chai";
import {
  deployVestingImplementation,
  deployAndInitializeVestingProxy,
  deployProxyAdmin,
} from "../../helpers/helpers";
import { address, increaseTime, mine, aboutEquals } from "../../helpers/utils";
import { GWEI, ETHER, YEAR } from "../../helpers/constants";
import { ERC20MintableBurnable } from "../../typechain/ERC20MintableBurnable";

describe("Vesting", function () {
  let signers: Signer[];
  let owner: Signer;
  let beneficiary: Signer;
  let dao: Signer;
  let proxyAdmin: Contract;
  let token: ERC20MintableBurnable;
  let anotherToken: ERC20MintableBurnable;
  let vestingContract: Contract;
  let vestingImplementation: Contract;

  before(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    beneficiary = signers[1];
    dao = signers[2];
    proxyAdmin = (await deployProxyAdmin(owner)).contract;
    let tokenFactory = await ethers.getContractFactory("ERC20MintableBurnable");
    token = await tokenFactory.deploy();
    anotherToken = await tokenFactory.deploy();
    vestingImplementation = (await deployVestingImplementation(owner)).contract;
    await token.deployed();
    await anotherToken.deployed();
  });

  beforeEach(async function () {
    await token.burn(
      await address(beneficiary),
      await token.balanceOf(await address(beneficiary))
    );
    await token.burn(
      await address(owner),
      await token.balanceOf(await address(owner))
    );
    await anotherToken.burn(
      await address(beneficiary),
      await token.balanceOf(await address(beneficiary))
    );
    await anotherToken.burn(
      await address(owner),
      await token.balanceOf(await address(owner))
    );
    expect(await token.balanceOf(await address(beneficiary))).to.be.equal(0);
    expect(await token.balanceOf(await address(owner))).to.be.equal(0);
  });

  describe("Nonrevocable Vesting Contract", function () {
    it("Should deploy an unrevocable vesting contract and deposit some tokens", async () => {
      vestingContract = (
        await deployAndInitializeVestingProxy(
          owner,
          vestingImplementation,
          await address(beneficiary),
          proxyAdmin,
          BigNumber.from("0"),
          ETHER.div(5),
          false
        )
      ).contract;
      expect(await vestingContract.beneficiary()).to.equal(
        await beneficiary.getAddress()
      );
      expect(await vestingContract.revocable()).to.equal(false);
      expect(await vestingContract.released(token.address)).to.equal(
        BigNumber.from("0")
      );

      expect(await vestingContract.releasableAmount(token.address)).to.equal(
        BigNumber.from("0")
      );
      await token.connect(owner).mint(vestingContract.address, ETHER);
      expect(await token.balanceOf(vestingContract.address)).to.equal(ETHER);
    });

    it("Should release ~10% of the tokens in the first six months", async () => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(
        aboutEquals(
          await vestingContract.releasableAmount(token.address),
          ETHER.div(10)
        )
      ).to.equal(true);
      await vestingContract.release(token.address);
      expect(
        aboutEquals(await token.balanceOf(await address(beneficiary)), ETHER.div(10))
      ).to.equal(true);
    });

    it("Should release ~10% more of the tokens after the first year (20% total)", async () => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(
        aboutEquals(
          await vestingContract.releasableAmount(token.address),
          ETHER.div(10)
        )
      ).to.equal(true);
      await vestingContract.release(token.address);
      expect(
        aboutEquals(await token.balanceOf(await address(beneficiary)), ETHER.div(10))
      ).to.equal(true);
    });

    it("Should release ~8% of the tokens after 18 months", async () => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(
        aboutEquals(
          await vestingContract.releasableAmount(token.address),
          ETHER.mul(8).div(100)
        )
      ).to.equal(true);
      await vestingContract.release(token.address);
      expect(
        aboutEquals(
          await token.balanceOf(await address(beneficiary)),
          ETHER.mul(8).div(100)
        )
      ).to.equal(true);
    });

    it("Should release ~8% of the tokens after 24 months", async () => {
      await increaseTime(YEAR / 2);
      await mine();
      expect(
        aboutEquals(
          await vestingContract.releasableAmount(token.address),
          ETHER.mul(8).div(100)
        )
      ).to.equal(true);
      await vestingContract.release(token.address);
      expect(
        aboutEquals(
          await token.balanceOf(await address(beneficiary)),
          ETHER.mul(8).div(100)
        )
      ).to.equal(true);
    });

    it("Should release ~12.8% of the tokens after 36 months", async () => {
      await increaseTime(YEAR);
      await mine();
      expect(
        aboutEquals(
          await vestingContract.releasableAmount(token.address),
          ETHER.mul(128).div(1000)
        )
      ).to.equal(true);
      await vestingContract.release(token.address);
      expect(
        aboutEquals(
          await token.balanceOf(await address(beneficiary)),
          ETHER.mul(128).div(1000)
        )
      ).to.equal(true);
    });

    it("Releasable amount should strictly increase over time", async () => {
      // Testing for 20 years
      for (let i = 0; i < 240; i++) {
        let prevReleasable = await vestingContract.releasableAmount(
          token.address
        );
        await increaseTime(YEAR / 12);
        await mine();
        expect(await vestingContract.releasableAmount(token.address)).to.be.gt(
          prevReleasable
        );
      }
    });

    it("Should do a partial release.", async () => {
      await increaseTime(YEAR);
      await vestingContract.partialRelease(token.address, GWEI);
      expect(await token.balanceOf(await address(beneficiary))).to.equal(GWEI);
    });

    it("Should release the rest of the tokens", async () => {
      await vestingContract.release(token.address);
      expect(await token.balanceOf(await address(beneficiary))).to.be.gt(
        BigNumber.from("0")
      );
    });

    it("Deposit more tokens. More tokens should release.", async () => {
      await token.connect(owner).mint(await address(vestingContract), ETHER);
      await vestingContract.release(token.address);
      expect(await token.balanceOf(await address(beneficiary))).to.be.gt(0);
    });

    it("Should release multiple tokens when multiple tokens are deposited.", async () => {
      await token.connect(owner).mint(await address(vestingContract), ETHER);
      await anotherToken
        .connect(owner)
        .mint(await address(vestingContract), ETHER);
      await vestingContract.batchRelease([token.address, anotherToken.address]);
      expect(await token.balanceOf(await address(beneficiary))).to.be.gt(0);
      expect(await anotherToken.balanceOf(await address(beneficiary))).to.be.gt(
        0
      );
    });
  });

  describe("Revocable Vesting Contract", function () {
    it("Should deploy a revocable vesting contract and deposit some tokens", async () => {
      // Reset the beneficiary's token balance
      await token
        .connect(owner)
        .burn(
          await beneficiary.getAddress(),
          await token.balanceOf(await beneficiary.getAddress())
        );
      expect(await token.balanceOf(await beneficiary.getAddress())).to.equal(
        BigNumber.from(0)
      );

      vestingContract = (
        await deployAndInitializeVestingProxy(
          owner,
          vestingImplementation,
          await address(beneficiary),
          proxyAdmin,
          BigNumber.from("0"),
          BigNumber.from("2000"),
          true
        )
      ).contract;
      expect(await vestingContract.beneficiary()).to.equal(
        await beneficiary.getAddress()
      );
      expect(await vestingContract.revocable()).to.equal(true);
      expect(await vestingContract.released(token.address)).to.equal(
        BigNumber.from(0)
      );

      await token.connect(owner).mint(vestingContract.address, ETHER);
      expect(await token.balanceOf(vestingContract.address)).to.equal(ETHER);
      expect(await vestingContract.releasableAmount(token.address)).to.equal(
        BigNumber.from(0)
      );
    });

    it("Time passes after cliff. Owner revokes. Beneficiary gets vested tokens. Vesting contract holds no more tokens. Owner receives the rest.", async () => {
      const ownerBalance = await token.balanceOf(await owner.getAddress());
      await increaseTime(20000);
      await vestingContract.connect(owner).revoke(token.address);
      expect(await token.balanceOf(vestingContract.address)).to.be.gt(
        BigNumber.from(0)
      );
      expect(await vestingContract.releasableAmount(token.address)).to.be.gt(
        BigNumber.from(0)
      );
      await vestingContract.release(token.address);
      await mine();
      expect(await token.balanceOf(vestingContract.address)).to.equal(
        BigNumber.from(0)
      );
      expect(await token.balanceOf(await beneficiary.getAddress())).to.be.gt(
        BigNumber.from(0)
      );
      expect(await token.balanceOf(await owner.getAddress())).to.be.gt(
        ownerBalance
      );
    });
  });
});

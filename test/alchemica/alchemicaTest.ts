import * as fs from "fs";
import * as hre from "hardhat";
import { ethers } from "hardhat";
import { Signer, Contract, ContractFactory, BigNumber, Wallet } from "ethers";
import { expect } from "chai";
import {
  deployAlchemicaImplementation,
  deployAndInitializeAlchemicaProxy,
  deployProxyAdmin,
  permit,
} from "../../helpers/helpers";
import { GWEI, ETHER, YEAR, FUD_PARAMS } from "../../helpers/constants";
import { address } from "../../helpers/utils";

describe("Alchemica", function () {
  let signers: Signer[];
  let owner: Signer;
  let realmDiamond: Signer;
  let proxyAdmin: Contract;
  let fud: Contract;

  before(async function () {
    signers = await ethers.getSigners();
    owner = signers[0];
    realmDiamond = signers[1];
    proxyAdmin = (await deployProxyAdmin(owner)).contract;
    let implementation = await deployAlchemicaImplementation(owner);
    fud = (
      await deployAndInitializeAlchemicaProxy(
        owner,
        implementation.contract,
        proxyAdmin,
        FUD_PARAMS.name,
        FUD_PARAMS.symbol,
        FUD_PARAMS.supply,
        await address(realmDiamond),
        signers[2],
        signers[3]
      )
    ).contract;
  });

  it("should mint 10% of the total supply to the vesting contracts", async function () {
    expect(await fud.cap()).to.equal(FUD_PARAMS.supply);
    expect(await fud.balanceOf(signers[2].getAddress())).to.equal(
      FUD_PARAMS.supply.div(10)
    );
    expect(await fud.balanceOf(signers[3].getAddress())).to.equal(
      FUD_PARAMS.supply.div(10)
    );
  });

  it("Realm diamond should have access to minting", async function () {
    await fud.connect(realmDiamond).mint(await owner.getAddress(), ETHER);
    expect(await fud.balanceOf(await owner.getAddress())).to.equal(ETHER);
  });

  it("Should batch transfer", async function () {
    await fud
      .connect(owner)
      .batchTransfer(
        [
          await signers[4].getAddress(),
          await signers[5].getAddress(),
          await signers[4].getAddress(),
        ],
        [2, 1, 5]
      );
    expect(await fud.balanceOf(await signers[4].getAddress())).to.equal(7);
    expect(await fud.balanceOf(await signers[5].getAddress())).to.equal(1);
  });

  it("Should permit", async function () {
    await permit(
      hre,
      fud,
      owner as Wallet,
      await owner.getAddress(),
      BigNumber.from("1000"),
      await fud.nonces(await owner.getAddress()),
      BigNumber.from("999999999999999"),
    );
  })
});

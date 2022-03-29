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
    let otherSigner = signers[2];

    await expect(
      fud.connect(otherSigner).mint(await owner.getAddress(), ETHER)
    ).to.be.revertedWith("Only RealmDiamond");

    await fud.connect(realmDiamond).mint(await owner.getAddress(), ETHER);
    expect(await fud.balanceOf(await owner.getAddress())).to.equal(ETHER);
  });

  it("Only owner can update RealmDiamond", async function () {
    let otherSigner = signers[2];

    await expect(
      fud.connect(otherSigner).updateRealmDiamond(await owner.getAddress())
    ).to.be.revertedWith("Ownable: caller is not the owner");

    await fud
      .connect(realmDiamond)
      .updateRealmDiamond(await owner.getAddress());
  });

  it("Should permit", async function () {
    await permit(
      fud,
      owner as Wallet,
      await owner.getAddress(),
      BigNumber.from("1000"),
      await fud.nonces(await owner.getAddress()),
      BigNumber.from("999999999999999")
    );
  });
});

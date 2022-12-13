import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { AlchemicaFacet } from "../../typechain";
import { alchemica, maticVars } from "../../constants";
import { upgradeRealm } from "../../scripts/realm/upgrades/upgrade-alchemicaFacet";
import { expect } from "chai";

describe("Testing events on batchTransferTokensToGotchis", async function () {
  const testAddress = "0x2c1a288353e136b9e4b467aadb307133fffeab25";
  let alchemicaFacet: AlchemicaFacet;

  before(async function () {
    this.timeout(20000000);

    await upgradeRealm();

    alchemicaFacet = (await ethers.getContractAt(
      "AlchemicaFacet",
      maticVars.realmDiamond
    )) as AlchemicaFacet;
  });

  it("test upgrade", async function () {
    alchemicaFacet = await impersonate(
      testAddress,
      alchemicaFacet,
      ethers,
      network
    );
    const receipt = await (
      await alchemicaFacet.batchTransferTokensToGotchis([24186], alchemica, [
        [
          ethers.utils.parseEther("0.6"),
          ethers.utils.parseEther("1.1"),
          ethers.utils.parseEther("4.3"),
          ethers.utils.parseEther("0.1"),
        ],
      ])
    ).wait();
    const events = receipt.events.filter(
      (event) => event.event === "TransferTokensToGotchi"
    );
    expect(events.length).to.equal(4);
  });
});

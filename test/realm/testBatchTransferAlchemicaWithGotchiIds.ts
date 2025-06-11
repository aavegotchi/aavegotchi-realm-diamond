import { impersonate } from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { AlchemicaFacet } from "../../typechain";
import { alchemica, maticVars } from "../../constants";
import { expect } from "chai";
import { upgradeBatchTransferAlchemicaWithGotchiIds } from "../../scripts/realm/upgrades/upgrade-batchTransferAlchemicaWithGotchiIds";

describe("Testing events on batchTransferTokensToGotchis", async function () {
  const testAddress = "0x2c1a288353e136b9e4b467aadb307133fffeab25";
  const testDestAddress = "0xb7601193f559de56D67FB8e6a2AF219b05BD36c7";
  const testGotchiId = 24186;
  const testAmounts = [
    ethers.utils.parseEther("0.01"),
    ethers.utils.parseEther("0.02"),
    ethers.utils.parseEther("0.03"),
    ethers.utils.parseEther("0.01"),
  ];

  let alchemicaFacet: AlchemicaFacet;

  before(async function () {
    this.timeout(20000000);

    await upgradeBatchTransferAlchemicaWithGotchiIds();

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
      await alchemicaFacet.batchTransferAlchemicaWithGotchiIds(
        [testGotchiId],
        [testDestAddress],
        [testAmounts]
      )
    ).wait();
    const events = receipt.events.filter(
      (event) => event.event === "TransferTokensWithGotchiId"
    );
    expect(events.length).to.equal(4);

    events.forEach((event, i) => {
      expect(event.args._tokenAddress).to.equal(alchemica[i]);
      expect(event.args._targetAddress).to.equal(testDestAddress);
      expect(event.args._amount).to.equal(testAmounts[i]);
    });
  });
});

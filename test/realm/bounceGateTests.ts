import { impersonate, impersonateSigner } from "../../scripts/helperFunctions";
import {
  InstallationFacet,
  RealmFacet,
  BounceGateFacet,
  SetPubKeyFacet,
  OwnershipFacet,
  InstallationAdminFacet,
} from "../../typechain";
import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, BigNumberish, BytesLike } from "ethers";

import { upgrade } from "../../scripts/realm/upgrades/upgrade-bounceGate";
import { Constants, varsForNetwork } from "../../constants";
import { InstallationTypeInput } from "../../types";
import { genEquipInstallationSignature } from "../../scripts/realm/realmHelpers";

describe("Testing Bounce Gates", async function () {
  let bounceGateFacet: BounceGateFacet;
  let pubkeyFacet: SetPubKeyFacet;
  let ownershipFacet: OwnershipFacet;
  let installationFacet: InstallationFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let realmFacet: RealmFacet;

  let realmdiamondOwner;
  let ownerSigner;
  let parcelOwnerSigner;
  let startTime: BigNumber;
  const parcelOwner = "0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce";
  // const pubKey: BytesLike =
  //   "0x18db6dd94c8b8eeeeadbd0f7b4a0050135f086e0ba16f915773652d10e39e409a60a59adc13c2747f8fc4e405a08327849f51a2ed7073eb19f0a815c73dbd399";
  const realmId = 12860;
  const gotchiId = 3410;
  let priority: [BigNumberish, BigNumberish, BigNumberish, BigNumberish];

  let installations: InstallationTypeInput[] = [];
  let c: Constants;
  let priority2;
  before(async function () {
    this.timeout(20000000);
    c = await varsForNetwork(ethers);
    console.log("c:", c);
    //upgrade first
    await upgrade();
    ownershipFacet = (await ethers.getContractAt(
      "OwnershipFacet",
      c.realmDiamond
    )) as OwnershipFacet;
    realmdiamondOwner = await ownershipFacet.owner();
    ownerSigner = await impersonateSigner(realmdiamondOwner, ethers, network);
    parcelOwnerSigner = await impersonateSigner(parcelOwner, ethers, network);
    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond,
      ownerSigner
    )) as InstallationFacet;
    bounceGateFacet = (await ethers.getContractAt(
      "BounceGateFacet",
      c.realmDiamond,
      parcelOwnerSigner
    )) as BounceGateFacet;
    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      c.installationDiamond,
      ownerSigner
    )) as InstallationAdminFacet;
    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond,
      parcelOwnerSigner
    )) as RealmFacet;
    pubkeyFacet = (await ethers.getContractAt(
      "SetPubKeyFacet",
      c.realmDiamond,
      ownerSigner
    )) as SetPubKeyFacet;
    //set the public key
    // await pubkeyFacet.setPubKey(pubKey);
    //add bounce gate installation
    installations.push({
      deprecated: false,
      upgradeQueueBoost: 0,
      installationType: 8,
      level: 1,
      width: 2,
      height: 2,
      alchemicaType: 0,
      alchemicaCost: [
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
      ],
      harvestRate: 0,
      capacity: 0,
      spillRadius: 0,
      spillRate: 0,
      craftTime: 0,
      prerequisites: [1, 0],
      nextLevelId: 1,
      name: "Bounce gate",
      unequipType: 0,
    });
    installationFacet = await impersonate(
      parcelOwner,
      installationFacet,
      ethers,
      network
    );
    installationAdminFacet = await impersonate(
      realmdiamondOwner,
      installationAdminFacet,
      ethers,
      network
    );
    //add installation
    await installationAdminFacet.addInstallationTypes(installations);

    //17
    priority = [
      BigNumber.from("1000000000000000000"),
      BigNumber.from("1000000000000000000"),
      BigNumber.from("1000000000000000000"),
      BigNumber.from("1000000000000000000"),
    ];
    //2
    priority2 = [
      BigNumber.from("2000000000000000000"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
    ];
  });

  // it("Cannot create events if bounce gate is not equipped", async () => {
  //   // await testInstallationFacet.testCraftInstallations([10]);
  //   // await testRealmFacet.testEquipInstallation(realmId, 10, 3, 3);

  //   await expect(
  //     bounceGateFacet.createEvent(
  //       "Gotchigang Hangout",
  //       Date.now(),
  //       BigNumber.from(300).mul(60),
  //       priority,
  //       realmId
  //     )
  //   ).to.revertedWith("NoBounceGate()");
  // });
  // it("Can only equip one bounceGate ", async () => {
  //   //craft 2 bouncegates
  //   await installationFacet.craftInstallations([BigNumber.from(137)], [0]);
  //   await installationFacet.craftInstallations([BigNumber.from(137)], [0]);

  //   const sig = await genEquipInstallationSignature(
  //     realmId,
  //     gotchiId,
  //     137,
  //     0,
  //     4
  //   );
  //   const sig2 = await genEquipInstallationSignature(
  //     realmId,
  //     gotchiId,
  //     137,
  //     0,
  //     2
  //   );
  //   await realmFacet.equipInstallation(realmId, gotchiId, 137, 0, 4, sig);
  //   await expect(
  //     realmFacet.equipInstallation(realmId, gotchiId, 137, 0, 2, sig2)
  //   ).to.revertedWith("LibAlchemica: Bounce Gate already equipped");
  // });

  it("Only parcel owner can create an event", async () => {
    await expect(
      bounceGateFacet
        .connect(ownerSigner)
        .createEvent("Gotchigang Hangout", Date.now(), 300, priority, realmId)
    ).to.revertedWith("NotParcelOwner()");
  });

  it("Cannot create events in the past", async () => {
    await expect(
      bounceGateFacet.createEvent(
        "Gotchigang Hangout",
        getCurrentTime().sub(100),
        300,
        priority,
        realmId
      )
    ).to.revertedWith("StartTimeError()");
  });

  it("Event name must be less than 35 chars", async () => {
    await expect(
      bounceGateFacet.createEvent(
        "Gotchigang Hangout but in this case, length of characters exceeds 35",
        Date.now() - 60,
        BigNumber.from(300).mul(60),
        priority,
        realmId
      )
    ).to.revertedWith("TitleLengthOverflow()");
  });

  it("Cannot create events simultaneously", async () => {
    //create an event for 5 hours
    await bounceGateFacet.createEvent(
      "Gotchigang Hangout",
      getCurrentTime().add(60),
      BigNumber.from(300),
      priority,
      realmId
    );
    //try to create another event
    startTime = getCurrentTime().add(60);
    await expect(
      bounceGateFacet.createEvent(
        "Gotchigang Hangout",
        startTime,
        BigNumber.from(300),
        priority,
        realmId
      )
    ).to.revertedWith("OngoingEvent()");

    const eventDetails = await bounceGateFacet.viewEvent(realmId);

    expect(eventDetails.priority).to.equal(17000);
  });

  it("Priority doesn't decay for events that have not started", async () => {
    await ethers.provider.send("evm_increaseTime", [50]);
    await ethers.provider.send("evm_mine", []);
    const eventDetails = await bounceGateFacet.viewEvent(realmId);
    expect(eventDetails.priority).to.equal(17000);
  });
  it("Should update events that have not ended ", async () => {
    //extend duration by 19hours
    //extend priority by 2
    await bounceGateFacet.updateEvent(realmId, priority2, 1140);
    const eventDetails = await bounceGateFacet.viewEvent(realmId);
    expect(eventDetails.priority).to.equal(19000);
  });

  it("Priority should decay at a 0.01% rate every minute", async () => {
    const currentPriority = await (
      await bounceGateFacet.viewEvent(realmId)
    ).priority;

    // console.log("current pririty:", currentPriority);
    //jump through 20 minutes
    await ethers.provider.send("evm_increaseTime", [1200]);
    await ethers.provider.send("evm_mine", []);
    const newPriority = await (
      await bounceGateFacet.viewEvent(realmId)
    ).priority;

    // console.log("new priority:", newPriority);

    const expectedDecay = getDecayedPriority(
      BigNumber.from(1200).div(60),
      currentPriority
    );
    //hardhat time jumps are not precise so we check for ranges
    expect(newPriority).to.closeTo(
      currentPriority.sub(expectedDecay),
      currentPriority.sub(expectedDecay).sub(40)
    );
  });

  it("Priority should go approach 0 after a very long time", async () => {
    const currentPriority = await (
      await bounceGateFacet.viewEvent(realmId)
    ).priority;

    console.log("current pririty:", currentPriority);
    //jump through 20 minutes
    await ethers.provider.send("evm_increaseTime", [86400 * 200]);
    await ethers.provider.send("evm_mine", []);
    const newPriority = await (
      await bounceGateFacet.viewEvent(realmId)
    ).priority;

    console.log("new priority:", newPriority);

    //hardhat time jumps are not precise so we check for ranges
    expect(newPriority).to.equal(0);
  });

  it("Priority should go back up after update", async () => {
    await bounceGateFacet.updateEvent(realmId, priority2, 1140);
    const eventDetails = await bounceGateFacet.viewEvent(realmId);
    expect(eventDetails.priority).to.equal(2000);
  });

  it("Cannot unequip till event ends", async () => {
    const sig = await genEquipInstallationSignature(
      realmId,
      gotchiId,
      137,
      0,
      4
    );

    await expect(
      realmFacet.unequipInstallation(realmId, gotchiId, 137, 0, 4, sig)
    ).to.revertedWith("LibAlchemica: Ongoing event, cannot unequip Portal");
  });

  it("Can unequip after event ends or is cancelled", async () => {
    //jump to end of event
    await ethers.provider.send("evm_increaseTime", [86400]);
    await ethers.provider.send("evm_mine", []);

    const sig = await genEquipInstallationSignature(
      realmId,
      gotchiId,
      137,
      0,
      4
    );

    await realmFacet.unequipInstallation(realmId, gotchiId, 137, 0, 4, sig);
  });
});

function getCurrentTime() {
  const timeNow = Date.now() / 1000;
  return BigNumber.from(timeNow.toFixed());
}

function getDecayedPriority(
  minsElapsed: BigNumber,
  currentPriority: BigNumber
) {
  if (minsElapsed.gt(0)) {
    //reduces by 0.01% every minute
    const negPriority = currentPriority.mul(minsElapsed);
    if (currentPriority > negPriority) {
      return currentPriority.mul(negPriority);
    } else {
      return 0;
    }
  } else {
    console.log(currentPriority);
    return currentPriority;
  }
}

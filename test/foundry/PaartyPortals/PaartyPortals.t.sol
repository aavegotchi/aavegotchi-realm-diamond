// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

import {TestConstants} from "@test/constants.t.sol";
import "../../../contracts/RealmDiamond/facets/RealmFacet.sol";
import "../../../contracts/RealmDiamond/facets/PaartyPortalFacet.sol";
import "./Helpers.sol";
import "../SetPubKeyFacet.sol";
import "../../../contracts/interfaces/IDiamondCut.sol";
import "../../../contracts/shared/OwnershipFacet.sol";

contract PaartyPortalTests is Test, Helpers {
  PaartyPortalFacet partyFacet;
  RealmFacet rFacet;
  SetPubKeyFacet setPub;

  IDiamondCut dCut = IDiamondCut(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
  PaartyPortalFacet partyDiamondFacet = PaartyPortalFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
  RealmFacet rDiamondFacet = RealmFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);
  SetPubKeyFacet setPubKeyDiamondFacet = SetPubKeyFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC);

  address REALM_USER = 0x3a79bF3555F33f2adCac02da1c4a0A0163F666ce;
  uint256 realmId = 12860;
  uint256 gotchiId = 3410;

  uint256[4] totalPriority = [100e18, 100e18, 100e18, 100e18]; //priority 17

  //BURNER WALLET..DO NOT USE IN PRODUCTION
  uint256 privKey = 0x18329f54ac729d4765e74e32b1bf7a5ced7a2c0136a03ce18ed1590d43f39890;
  bytes pubKey =
    fromHex("18db6dd94c8b8eeeeadbd0f7b4a0050135f086e0ba16f915773652d10e39e409a60a59adc13c2747f8fc4e405a08327849f51a2ed7073eb19f0a815c73dbd399");

  function setUp() public {
    address diamondOwner = OwnershipFacet(TestConstants.REALM_DIAMOND_ADDRESS_MATIC).owner();
    vm.startPrank(diamondOwner);
    partyFacet = new PaartyPortalFacet();
    rFacet = new RealmFacet();
    setPub = new SetPubKeyFacet();
    //upgrade diamond
    IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](3);
    cut[0] = IDiamondCut.FacetCut({
      facetAddress: address(partyFacet),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: generateSelectors("PaartyPortalFacet")
    });
    cut[1] = IDiamondCut.FacetCut({
      facetAddress: address(rFacet),
      action: IDiamondCut.FacetCutAction.Replace,
      functionSelectors: generateSelectors("RealmFacet")
    });

    cut[2] = IDiamondCut.FacetCut({
      facetAddress: address(setPub),
      action: IDiamondCut.FacetCutAction.Add,
      functionSelectors: generateSelectors("SetPubKeyFacet")
    });

    dCut.diamondCut(cut, address(0), "");

    //change pubKey to enable signing
    setPubKeyDiamondFacet.setPubKey(pubKey);

    uint256[] memory prereqs = new uint256[](2);
    prereqs[0] = 1;
    prereqs[1] = 0;
    InstallationAdminFacetI.InstallationTypeIO[] memory installation = new InstallationAdminFacetI.InstallationTypeIO[](1);
    installation[0] = InstallationAdminFacetI.InstallationTypeIO({
      width: 2,
      height: 2,
      installationType: 7, //0 = altar, 1 = harvester, 2 = reservoir, 3 = gotchi lodge, 4 = wall, 5 = NFT display, 6 = buildqueue booster
      level: 1, //max level 9
      alchemicaType: 0, //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
      spillRadius: 0,
      spillRate: 0,
      upgradeQueueBoost: 0,
      craftTime: 0, // in blocks
      nextLevelId: 1, //the ID of the next level of this installation. Used for upgrades.
      deprecated: false, //bool
      alchemicaCost: [uint256(0), 0, 0, 0], // [fud, fomo, alpha, kek]
      harvestRate: 0,
      capacity: 0,
      prerequisites: prereqs, //[0,0] altar level, lodge level
      name: "Bounce Gate",
      unequipType: 0
    });

    //add new installation aka Bounce Gate
    InstallationAdminFacetI(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).addInstallationTypes(installation);

    vm.stopPrank();
    //mint 2 Bounce Gates
    vm.prank(REALM_USER);
    InstallationAdminFacetI(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).craftInstallations(populateUint16Array(137), populateUint40Array(0));
    vm.prank(REALM_USER);
    InstallationAdminFacetI(TestConstants.INSTALLATION_DIAMOND_ADDRESS_MATIC).craftInstallations(populateUint16Array(137), populateUint40Array(0));
  }

  function testEventCreation() public {
    vm.prank(REALM_USER);
    //a Bounce Gate must be equipped
    vm.expectRevert(NoPaarty.selector);
    partyDiamondFacet.createEvent(
      "Gotchigang hangout",
      uint64(block.timestamp + 1 minutes),
      "random string",
      300,
      [uint256(100e18), 0, 0, 0],
      realmId
    );

    vm.prank(REALM_USER);

    // equip a Bounce Gate
    //can equip a Bounce Gate
    bytes memory sig = constructSig(realmId, gotchiId, 137, 0, 4, privKey);
    rDiamondFacet.equipInstallation(realmId, gotchiId, 137, 0, 4, sig);

    vm.prank(REALM_USER);
    //cannot equip more than 1 Bounce Gate
    sig = constructSig(realmId, gotchiId, 137, 0, 2, privKey);
    vm.expectRevert("LibAlchemica:Bounce Gate already equipped");
    rDiamondFacet.equipInstallation(realmId, gotchiId, 137, 0, 2, sig);

    //only parcel owner can create event
    vm.expectRevert(NotParcelOwner.selector);
    partyDiamondFacet.createEvent(
      "Gotchigang hangout",
      uint64(block.timestamp + 1 minutes),
      "random string",
      300,
      [uint256(100e18), 0, 0, 0],
      realmId
    );

    vm.startPrank(REALM_USER);

    //cannot create an event in the past
    vm.expectRevert(StartTimeError.selector);
    partyDiamondFacet.createEvent("Gotchigang hangout", uint64(block.timestamp - 1 minutes), "random string", 300, totalPriority, realmId);

    //create an event
    partyDiamondFacet.createEvent("Gotchigang hangout", uint64(block.timestamp + 1 minutes), "random string", 300, totalPriority, realmId);

    //cannot create simultaneous events
    vm.expectRevert(OngoingEvent.selector);
    partyDiamondFacet.createEvent(
      "Gotchigang hangout",
      uint64(block.timestamp + 1 minutes),
      "random string",
      300,
      [uint256(100e18), 0, 0, 0],
      realmId
    );

    assertEq(partyDiamondFacet.viewEvent(realmId).priority, 17);

    uint256 endTimeBefore = partyDiamondFacet.viewEvent(realmId).endTime;

    //extend duration by 4020 minutes(total duration now 3 days) and priority by 2
    partyDiamondFacet.updateEvent(realmId, [uint256(200e18), 0, 0, 0], 4020);
    assertEq(partyDiamondFacet.viewEvent(realmId).priority, 19);
    assertEq(partyDiamondFacet.viewEvent(realmId).endTime, endTimeBefore + 4020 minutes);

    //extending duration should fail
    vm.expectRevert(DurationTooHigh.selector);
    partyDiamondFacet.updateEvent(realmId, [uint256(0), 0, 0, 0], 1);

    //warp to end of event
    vm.warp(block.timestamp + 3 days + 2 minutes);

    //priority cannot be changed for ended events
    vm.expectRevert(PaartyEnded.selector);
    partyDiamondFacet.updateEvent(realmId, [uint256(100), 0, 0, 0], 0);

    //can create another event
    partyDiamondFacet.createEvent("Gotchigang hangout2", uint64(block.timestamp + 1 minutes), "random string", 200, totalPriority, realmId);

    //unequiping should fail until event ends
    sig = constructSig(realmId, gotchiId, 137, 0, 4, privKey);
    vm.expectRevert("LibAlchemica:Ongoing event,cannot unequip Portal");
    rDiamondFacet.unequipInstallation(realmId, gotchiId, 137, 0, 4, sig);

    //end event and unequip
    vm.warp(block.timestamp + 210 minutes);
    rDiamondFacet.unequipInstallation(realmId, gotchiId, 137, 0, 4, sig);
    //portal should now be unequipped
    assertEq(partyDiamondFacet.viewEvent(realmId).equipped, false);
  }

  function generateSelectors(string memory _facetName) internal returns (bytes4[] memory selectors) {
    string[] memory cmd = new string[](3);
    cmd[0] = "node";
    cmd[1] = "scripts/genSelectors.js";
    cmd[2] = _facetName;
    bytes memory res = vm.ffi(cmd);
    selectors = abi.decode(res, (bytes4[]));
  }
}

interface InstallationAdminFacetI {
  struct InstallationTypeIO {
    uint8 width;
    uint8 height;
    uint16 installationType; //0 = altar, 1 = harvester, 2 = reservoir, 3 = gotchi lodge, 4 = wall, 5 = NFT display, 6 = buildqueue booster
    uint8 level; //max level 9
    uint8 alchemicaType; //0 = none 1 = fud, 2 = fomo, 3 = alpha, 4 = kek
    uint32 spillRadius;
    uint16 spillRate;
    uint8 upgradeQueueBoost;
    uint32 craftTime; // in blocks
    uint32 nextLevelId; //the ID of the next level of this installation. Used for upgrades.
    bool deprecated; //bool
    uint256[4] alchemicaCost; // [fud, fomo, alpha, kek]
    uint256 harvestRate;
    uint256 capacity;
    uint256[] prerequisites; //[0,0] altar level, lodge level
    string name;
    uint256 unequipType;
  }

  function addInstallationTypes(InstallationTypeIO[] calldata _installationTypes) external;

  function craftInstallations(uint16[] calldata _installationTypes, uint40[] calldata _gltr) external;
}

function populateUint16Array(uint256 _no) pure returns (uint16[] memory a) {
  a = new uint16[](1);
  a[0] = uint16(_no);
}

function populateUint40Array(uint256 _no) pure returns (uint40[] memory a) {
  a = new uint40[](1);
  a[0] = uint40(_no);
}

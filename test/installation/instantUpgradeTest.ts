import { impersonate, mineBlocks } from "../../scripts/helperFunctions";
import { ethers, network, run } from "hardhat";
import { expect } from "chai";
import {
  InstallationUpgradeFacet,
  InstallationAdminFacet,
  RealmFacet,
  InstallationFacet,
  RealmGettersAndSettersFacet,
  // Assuming AlchemicaFacet might be needed for balance checks later, or LibAlchemica for types
} from "../../typechain-types";
import { varsForNetwork } from "../../constants";
import { genEquipInstallationSignature } from "../../scripts/realm/realmHelpers";
import { upgrade } from "../../scripts/installation/upgrades/upgrade-addInstantUpgrade";
import { Signer, Wallet as EthersWallet } from "ethers"; // Added EthersWallet for specific typing

/*
 * NOTE: After adding signature validation to instantUpgrade function, the following updates are needed:
 * 1. Regenerate TypeScript types: `npx hardhat compile` (ASSUMED DONE for this update, but using `as any` for calls due to likely stale types)
 * 2. Import signature generation helper (similar to genEquipInstallationSignature) - Will be added below
 * 3. Update all test calls to include proper signatures - DONE
 * 4. The current test calls will fail due to signature validation - ADDRESSED
 */

// Define the TypeScript interface for the struct
interface InstantUpgradeParams {
  coordinateX: number;
  coordinateY: number;
  targetInstallationIds: number[];
  parcelId: number;
  realmDiamond: string;
}

// Helper function for generating instant upgrade signatures
async function genInstantUpgradeSignature(
  parcelId: number,
  coordinateX: number,
  coordinateY: number,
  targetInstallationIds: number[],
  gotchiId: number,
  signer: Signer
): Promise<string> {
  const messageHash = ethers.utils.solidityKeccak256(
    ["uint256", "uint16", "uint16", "uint256[]", "uint256"],
    [parcelId, coordinateX, coordinateY, targetInstallationIds, gotchiId]
  );
  const messageBytes = ethers.utils.arrayify(messageHash);
  return signer.signMessage(messageBytes);
}

describe("Testing Instant Upgrade Functionality", async function () {
  const ownerAddress = "0xC3c2e1Cf099Bc6e1fA94ce358562BCbD5cc59FE5"; // Renamed for clarity
  const realmId = 27843;
  const coordinateX = 0;
  const coordinateY = 0;
  const initialInstallationId = 10; // Level 1 installation
  const targetInstallationIdsLvl1to3 = [10, 11, 12, 13, 14]; // Upgrade path from level 1 to level 3

  let installationUpgradeFacet: InstallationUpgradeFacet;
  let installationAdminFacet: InstallationAdminFacet;
  let realmFacet: RealmFacet;
  let installationFacet: InstallationFacet;
  let realmGettersAndSettersFacet: RealmGettersAndSettersFacet;
  let c: any;
  let backendSigner: EthersWallet;
  let ownerSigner: Signer; // The impersonated owner
  const gotchiIdForUpgrade = 0; // Gotchi ID used for upgrade and signature

  before(async function () {
    this.timeout(20000000);

    c = await varsForNetwork(ethers);

    const backendPkFromEnv = process.env.REALM_PK;
    let actualBackendPk: string;

    if (backendPkFromEnv) {
      actualBackendPk = backendPkFromEnv;
      console.log("Using backend private key from TEST_BACKEND_PRIVATE_KEY.");
    } else {
      // Fallback to Hardhat's default accounts[1] private key if env var is not set.
      // This is for local testing convenience. For CI/CD, TEST_BACKEND_PRIVATE_KEY should be set.
      // WARNING: Do not use this specific private key for any sensitive or production purposes.
      actualBackendPk =
        "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
      console.warn(
        "TEST_BACKEND_PRIVATE_KEY environment variable is not set. " +
          "Using Hardhat default account 1's private key as fallback. " +
          "Ensure this is intended for your testing scenario."
      );
    }
    // Ensure backendSigner is always an ethers.Wallet instance
    // backendSigner = new ethers.Wallet(actualBackendPk, ethers.provider);

    //@ts-ignore
    backendSigner = new ethers.Wallet(process.env.REALM_PK); // PK should start with '0x'

    await upgrade(); // Ensures the InstallationUpgradeFacet is part of the diamond

    installationUpgradeFacet = (await ethers.getContractAt(
      "InstallationUpgradeFacet",
      c.installationDiamond
    )) as InstallationUpgradeFacet;

    installationAdminFacet = (await ethers.getContractAt(
      "InstallationAdminFacet",
      c.installationDiamond
    )) as InstallationAdminFacet;

    realmFacet = (await ethers.getContractAt(
      "RealmFacet",
      c.realmDiamond
    )) as RealmFacet;

    installationFacet = (await ethers.getContractAt(
      "InstallationFacet",
      c.installationDiamond
    )) as InstallationFacet;

    realmGettersAndSettersFacet = (await ethers.getContractAt(
      "RealmGettersAndSettersFacet",
      c.realmDiamond
    )) as RealmGettersAndSettersFacet;

    ownerSigner = await impersonate(
      ownerAddress,
      installationUpgradeFacet,
      ethers,
      network
    );

    // installationUpgradeFacet = installationUpgradeFacet.connect(ownerSigner);
    // installationAdminFacet = installationAdminFacet.connect(ownerSigner);

    installationAdminFacet = await impersonate(
      ownerAddress,
      installationAdminFacet,
      ethers,
      network
    );

    installationUpgradeFacet = await impersonate(
      ownerAddress,
      installationUpgradeFacet,
      ethers,
      network
    );

    realmFacet = await impersonate(ownerAddress, realmFacet, ethers, network);

    // realmFacet = realmFacet.connect(ownerSigner);

    // // Set the backend public key in the contract using InstallationAdminFacet.setAddresses
    // // This ensures s.backendPubKey matches the backendSigner used in tests.
    // if (
    //   !c.aavegotchiDiamond ||
    //   !c.realmDiamond ||
    //   !c.gltr ||
    //   !c.pixelcraftAddress ||
    //   !c.daoAddress
    // ) {
    //   throw new Error(
    //     "One or more required addresses (aavegotchiDiamond, realmDiamond, gltr, pixelcraftAddress, daoAddress) are missing from varsForNetwork (constants)."
    //   );
    // }

    // backendSigner is now guaranteed to be an ethers.Wallet, so .publicKey is available.
    const backendPubKeyForContract = ethers.utils.hexDataSlice(
      backendSigner.publicKey,
      1
    );

    // try {
    //   await installationAdminFacet.setAddresses(
    //     c.aavegotchiDiamond, // _aavegotchiDiamond
    //     c.realmDiamond, // _realmDiamond
    //     c.gltr, // _gltr
    //     c.pixelcraftAddress, // _pixelcraftAddress
    //     c.daoAddress, // _daoAddress
    //     backendPubKeyForContract // _backendPubKey
    //   );
    //   console.log(
    //     `InstallationAdminFacet addresses set, backendPubKey configured to: ${await backendSigner.getAddress()} (derived from PK)`
    //   );
    // } catch (error) {
    //   console.error(
    //     "Failed to set addresses via installationAdminFacet.setAddresses:",
    //     error
    //   );
    //   throw new Error(
    //     `Failed to set addresses on InstallationAdminFacet. Ensure '${ownerAddress}' is the owner of the installation diamond '${c.installationDiamond}' and that 'varsForNetwork' provides all necessary addresses. Original error: ${error}`
    //   );
    // }

    const equipSignature = await genEquipInstallationSignature(
      realmId,
      gotchiIdForUpgrade,
      initialInstallationId,
      coordinateX,
      coordinateY
      // backendSigner // Reverted: genEquipInstallationSignature likely uses its own signer
    );

    await realmFacet.equipInstallation(
      realmId,
      gotchiIdForUpgrade,
      initialInstallationId,
      coordinateX,
      coordinateY,
      equipSignature
    );
  });

  it("Should fail if target installation IDs array is empty", async () => {
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: [],
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );
    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        0, // gltr
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Must specify at least one upgrade target"
    );
  });

  it("Should fail if installation is not at specified coordinates", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const wrongCoordinateX = coordinateX + 1;
    const params: InstantUpgradeParams = {
      coordinateX: wrongCoordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        totalGltrCost,
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith("RealmGettersAndSettersFacet: wrong coordinates");
  });

  it("Should fail if trying to upgrade to a non-consecutive level", async () => {
    const invalidTargetIds = [10, 12];
    const totalGltrCost = await getTotalGltrCost(
      invalidTargetIds,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: invalidTargetIds,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        totalGltrCost,
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Next installation id must be the next level of the current installation"
    );
  });

  it("Should fail if GLTR amount is incorrect (less than required)", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );
    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        totalGltrCost - 1, // Less gltr
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith("InstallationUpgradeFacet: Incorrect GLTR sent");
  });

  it("Should fail if GLTR amount is incorrect (more than required)", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );
    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        totalGltrCost + 1, // More gltr
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith("InstallationUpgradeFacet: Incorrect GLTR sent");
  });

  it("Should fail with single installation array (no upgrades, length < 2)", async () => {
    const singleArray = [initialInstallationId];
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: singleArray,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );
    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        0, // gltr
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Must specify at least one upgrade target"
    );
  });

  it("Should successfully perform instant upgrade", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await (installationUpgradeFacet as any).instantUpgrade(
      params,
      totalGltrCost,
      gotchiIdForUpgrade,
      signature
    );

    const finalInstallationId =
      targetInstallationIdsLvl1to3[targetInstallationIdsLvl1to3.length - 1];
    await expect(
      realmGettersAndSettersFacet.checkCoordinates(
        realmId,
        coordinateX,
        coordinateY,
        finalInstallationId
      )
    ).to.not.be.reverted;
  });

  it("Should fail with an invalid signature", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    // Ensure backendSigner is a Wallet to access .signMessage
    if (!(backendSigner instanceof ethers.Wallet)) {
      throw new Error(
        "backendSigner is not an ethers.Wallet instance for signature generation"
      );
    }
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );
    const invalidSignature = signature.slice(0, -4) + "dead";

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        totalGltrCost,
        gotchiIdForUpgrade,
        invalidSignature
      )
    ).to.be.revertedWith("InstallationUpgradeFacet: Invalid signature");
  });

  it("Should fail with a valid signature but tampered data (e.g., different parcelId in struct)", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    // Ensure backendSigner is a Wallet to access .signMessage
    if (!(backendSigner instanceof ethers.Wallet)) {
      throw new Error(
        "backendSigner is not an ethers.Wallet instance for signature generation"
      );
    }
    // Signature for original realmId (parcelId)
    const signature = await genInstantUpgradeSignature(
      realmId, // Original parcelId for signature
      coordinateX,
      coordinateY,
      targetInstallationIdsLvl1to3,
      gotchiIdForUpgrade,
      backendSigner
    );

    const tamperedRealmId = realmId + 1;
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: tamperedRealmId, // Tampered parcelId in struct
      realmDiamond: c.realmDiamond,
    };

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params, // Params with tampered parcelId
        totalGltrCost,
        gotchiIdForUpgrade,
        signature // Original signature (for non-tampered parcelId)
      )
    ).to.be.revertedWith("InstallationUpgradeFacet: Invalid signature");
  });

  it("Should fail if msg.sender does not have access right (6)", async () => {
    const totalGltrCost = await getTotalGltrCost(
      targetInstallationIdsLvl1to3,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: targetInstallationIdsLvl1to3,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    const defaultSigners = await ethers.getSigners();
    const nonOwnerSuperSigner = defaultSigners[2];

    await expect(
      (
        installationUpgradeFacet.connect(nonOwnerSuperSigner) as any
      ).instantUpgrade(params, totalGltrCost, gotchiIdForUpgrade, signature)
    ).to.be.revertedWith("LibRealm: Access Right - Only Owner");
  });

  it("Should fail if initial installation is already at its defined max level in the path", async () => {
    const currentMaxLevelId = 14;
    const attemptFurtherUpgradePath = [currentMaxLevelId, 15];

    const type15 = await installationFacet.getInstallationTypes([15]);
    if (!type15[0])
      throw new Error(
        "Test setup: Installation type 15 not found for cost calculation"
      );
    const costForInvalidPath = type15[0].craftTime;

    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: attemptFurtherUpgradePath,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        Number(costForInvalidPath), // Ensure gltr is number
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Next installation id must be the next level of the current installation"
    );
  });

  it("Should fail if trying to upgrade to an installation type that is level > 9 (contract rule)", async () => {
    // Ensure the initial state for this specific test: parcel has installation type 10.
    const equipInitialSig = await genEquipInstallationSignature(
      realmId,
      gotchiIdForUpgrade,
      10, // Ensure initial installation is type 10 for this test path
      coordinateX,
      coordinateY
    );
    console.log("Attempting to equip installation 10 for 'level > 9' test...");
    await realmFacet.equipInstallation(
      realmId,
      gotchiIdForUpgrade,
      10,
      coordinateX,
      coordinateY,
      equipInitialSig
    );
    console.log("Equip installation 10 call completed.");

    // Verify the equipped installation using checkCoordinates
    try {
      await realmGettersAndSettersFacet.checkCoordinates(
        realmId,
        coordinateX,
        coordinateY,
        10
      );
      console.log(
        `State check: Installation 10 IS present at (${coordinateX},${coordinateY}) on parcel ${realmId} before instantUpgrade.`
      );
    } catch (e: any) {
      console.error(
        `State check failed: Installation 10 NOT present. checkCoordinates reverted: ${e.message}`
      );
      throw new Error(
        `Test setup failed: Expected installation 10 but checkCoordinates failed. Original error: ${e.message}`
      );
    }

    const pathToLevel10Type = [10, 11, 12, 13, 14, 20];
    const costToLevel10Type = await getTotalGltrCost(
      pathToLevel10Type,
      installationFacet
    );
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: pathToLevel10Type,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        costToLevel10Type,
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Installation is already at the max level"
    );
  });

  it("Should fail if trying to upgrade *from* a max level installation (e.g. nextLevelId is 0)", async () => {
    // Ensure the max level installation is equipped for this test isolation
    const equipMaxLevelSig = await genEquipInstallationSignature(
      realmId,
      gotchiIdForUpgrade,
      14,
      coordinateX,
      coordinateY
    );
    await realmFacet.equipInstallation(
      realmId,
      gotchiIdForUpgrade,
      14,
      coordinateX,
      coordinateY,
      equipMaxLevelSig
    );

    const currentIsMaxLevel = 14;
    const attemptPathFromMax = [currentIsMaxLevel, 15];

    const cost = await getTotalGltrCost(attemptPathFromMax, installationFacet);
    const params: InstantUpgradeParams = {
      coordinateX,
      coordinateY,
      targetInstallationIds: attemptPathFromMax,
      parcelId: realmId,
      realmDiamond: c.realmDiamond,
    };
    const signature = await genInstantUpgradeSignature(
      params.parcelId,
      params.coordinateX,
      params.coordinateY,
      params.targetInstallationIds,
      gotchiIdForUpgrade,
      backendSigner
    );

    await expect(
      (installationUpgradeFacet as any).instantUpgrade(
        params,
        cost,
        gotchiIdForUpgrade,
        signature
      )
    ).to.be.revertedWith(
      "InstallationUpgradeFacet: Next installation id must be the next level of the current installation"
    );
  });
});

async function getTotalGltrCost(
  targetInstallationIds: number[],
  installationFacet: InstallationFacet
): Promise<number> {
  let totalGltrCost = 0;
  if (targetInstallationIds.length < 2) {
    return 0;
  }
  for (let i = 1; i < targetInstallationIds.length; i++) {
    const installationIdToCraft = targetInstallationIds[i];
    const nextInstallationArray = await installationFacet.getInstallationTypes([
      installationIdToCraft,
    ]);
    if (
      nextInstallationArray &&
      nextInstallationArray.length > 0 &&
      nextInstallationArray[0]
    ) {
      totalGltrCost += Number(nextInstallationArray[0].craftTime);
    } else {
      console.warn(
        `Warning: Installation type ID ${installationIdToCraft} not found or has no craft time. Cost calculation may be inaccurate.`
      );
    }
  }
  return totalGltrCost;
}

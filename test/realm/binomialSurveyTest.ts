import {
  impersonate,
  maticDiamondAddress,
  mineBlocks,
  realmDiamondAddress,
} from "../../scripts/helperFunctions";
import { ethers, network } from "hardhat";
import { BigNumber } from "ethers";
import { expect } from "chai";
import { TestBeforeVars, UpgradeQueue, MintParcelInput } from "../../types";
import {
  alchemicaTotals, 
  boostMultipliers,
  greatPortalCapacity, 
} from "../../scripts/setVars";
import {
  approveAlchemica,
  beforeTest,
  faucetAlchemica,
  genEquipInstallationSignature,
  genChannelAlchemicaSignature,
  testInstallations,
} from "../../scripts/realm/realmHelpers";

describe("Testing Binomial Randomization", async function () {

  let g: TestBeforeVars;

  before(async function () {
    this.timeout(20000000);

    g = await beforeTest(ethers, realmDiamondAddress(network.name));

    g.alchemicaFacet = await impersonate(
      g.ownerAddress,
      g.alchemicaFacet,
      ethers,
      network
    );
    g.vrfFacet = await impersonate(
      g.ownerAddress,
      g.vrfFacet,
      ethers,
      network,
    );
    g.realmFacet = await impersonate(
      g.ownerAddress,
      g.realmFacet,
      ethers,
      network,
    );

    function range(size:number, startAt:number = 0) {
      return [...Array(size).keys()].map(i => i + startAt);
    }

    let inputs: MintParcelInput[] = range(5).map(i => ({
      coordinateX: 0,
      coordinateY: 0,
      district: 0,
      parcelId: "KEKW",
      parcelAddress: "KEK-KEK-KEK",
      size: i,
      boost: [0, 0, 0, 0],
    }));

    // mint some parcels
    await g.realmFacet.mintParcels(
      g.ownerAddress,
      range(5),
      inputs
    );

    for(let i = 0; i < 5; i++) {
      console.log(await g.realmFacet.getParcelInfo(i));
    }

    await g.alchemicaFacet.setVars(
      //@ts-ignore
      alchemicaTotals(),
      boostMultipliers,
      greatPortalCapacity,
      g.installationDiamond.address,
      g.ownerAddress,
      g.ownerAddress, //junk data
      [
        g.fud.address,
        g.fomo.address,
        g.alpha.address,
        g.kek.address,
      ],
      g.glmr.address,
      ethers.utils.hexDataSlice(g.ownerAddress, 1),
      g.ownerAddress,
      g.ownerAddress,
    );
  });

  it("Setup installation diamond", async function () {
    g.installationDiamond = await impersonate(
      g.installationOwner,
      g.installationDiamond,
      ethers,
      network
    );

    let installationsTypes = await g.installationDiamond.getInstallationTypes(
      []
    );

    await g.installationAdminFacet.addInstallationTypes(testInstallations());
    installationsTypes = await g.installationDiamond.getInstallationTypes([]);
    expect(installationsTypes.length).to.equal(testInstallations().length);
  });

  it("Test", async function () {
    console.log(await g.alchemicaFacet.getTotalAlchemicas());

    for(let size = 0; size < 5; size++) {
      let results: [BigNumber, BigNumber, BigNumber, BigNumber,] = [
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
        BigNumber.from(0),
      ];
      for(let i = 0; i < 100; i++ ) {
        await g.vrfFacet.testRawFulfillRandomWords(
          size, 
          [
            BigNumber.from(ethers.utils.keccak256(ethers.utils.hexlify(size * 400 + i * 4 + 42069))),
            BigNumber.from(ethers.utils.keccak256(ethers.utils.hexlify(size * 400 + i * 4 + 1 + 42069))),
            BigNumber.from(ethers.utils.keccak256(ethers.utils.hexlify(size * 400 + i * 4 + 2 + 42069))),
            BigNumber.from(ethers.utils.keccak256(ethers.utils.hexlify(size * 400 + i * 4 + 3 + 42069))),
          ], 
          0
        );
        let roundAlchemica = await g.alchemicaFacet.getRoundAlchemica(size, 0);
        for(let i = 0; i < 4; i++) {
          results[i] = results[i].add(roundAlchemica[i]);
        }
        //console.log(roundAlchemica.map(a => a.toString()));
      }
      for(let i = 0; i < 4; i++) {
        results[i] = results[i].div(25);
      }
      console.log("Average");
      console.log(results.map(a => a.toString()));
    }
  });
});
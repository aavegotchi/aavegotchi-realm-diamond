/* global ethers hre */
/* eslint prefer-const: "off" */

const { getSelectors, FacetCutAction } = require('./libraries/diamond.js')

async function deployDiamond () {
  const accounts = await ethers.getSigners()
  const contractOwner = accounts[0]

  // deploy DiamondCutFacet
  const DiamondCutFacet = await ethers.getContractFactory('DiamondCutFacet')
  const diamondCutFacet = await DiamondCutFacet.deploy()
  await diamondCutFacet.deployed()
  console.log('DiamondCutFacet deployed:', diamondCutFacet.address)

  // deploy Diamond
  const Diamond = await ethers.getContractFactory('Diamond')
  const diamond = await Diamond.deploy(contractOwner.address, diamondCutFacet.address)
  await diamond.deployed()
  console.log('Diamond deployed:', diamond.address)

  // deploy DiamondInit
  const DiamondInit = await ethers.getContractFactory('DiamondInit')
  const diamondInit = await DiamondInit.deploy()
  await diamondInit.deployed()
  console.log('DiamondInit deployed:', diamondInit.address)

  // deploy facets
  console.log('')
  console.log('Deploying facets')
  const FacetNames = [
    'DiamondLoupeFacet',
    'OwnershipFacet',
    'InitiatorFacet',
    'GBMFacet'
  ]
  const cut = []
  for (const FacetName of FacetNames) {
    const Facet = await ethers.getContractFactory(FacetName)
    const facet = await Facet.deploy()
    await facet.deployed()
    console.log(`${FacetName} deployed: ${diamondInit.address}`)
    cut.push({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet)
    })
  }

  // upgrade diamond with facets
  console.log('')
  console.log('Diamond Cut:', cut)
  const diamondCut = await ethers.getContractAt('IDiamondCut', diamond.address)
  let tx
  let receipt
  // call to init function
  let functionCall = diamondInit.interface.encodeFunctionData('init')
  tx = await diamondCut.diamondCut(cut, diamondInit.address, functionCall)
  console.log('Diamond cut tx: ', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Diamond upgrade failed: ${tx.hash}`)
  }
  console.log('Completed diamond cut')

  // Init GBM
  const ghstAddress = "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7";
  const _pixelcraft = "0xD4151c984e6CF33E04FFAAF06c3374B2926Ecc64";
  const _playerRewards = "0x27DF5C6dcd360f372e23d5e63645eC0072D0C098";
  const _daoTreasury = "0xb208f8BB431f580CC4b216826AFfB128cd1431aB";

  let startTime = Math.floor(Date.now() / 1000);
  let endTime = Math.floor(Date.now() / 1000) + 86400;
  let hammerTimeDuration = 300;
  let bidDecimals = 100000;
  let stepMin = 10000;
  let incMax = 10000;
  let incMin = 1000;
  let bidMultiplier = 11120;
  let floorPrice = 0;

  const initiatorFacet = await ethers.getContractAt('InitiatorFacet', diamond.address)

  console.log('Initialize contracts started...')
  tx = await initiatorFacet.initContracts(ghstAddress, _pixelcraft, _playerRewards, _daoTreasury)
  console.log('Initialize contracts tx:', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Initialize contracts failed: ${tx.hash}`)
  }
  console.log('Initialize contracts completed')

  console.log('Initialize default auction params started....')
  tx = await initiatorFacet.initAuctionParams(startTime, endTime, hammerTimeDuration, bidDecimals, stepMin, incMax, incMin, bidMultiplier, floorPrice)
  console.log('Initialize default auction params tx:', tx.hash)
  receipt = await tx.wait()
  if (!receipt.status) {
    throw Error(`Initialize default auction params  failed: ${tx.hash}`)
  }
  console.log('Initialize default auction params completed')

  return diamond.address
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  deployDiamond()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error)
      process.exit(1)
    })
}

exports.deployDiamond = deployDiamond

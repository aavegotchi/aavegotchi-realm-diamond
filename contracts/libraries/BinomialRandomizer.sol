pragma solidity 0.8.9;


library BinomialRandomizer {

  uint256 private constant BASE_DENOMINATOR = 10_000;

  // Averages out to 100_000_000 over many rolls
  function calculateAlchemicaSurveyAmount(uint256 seed, uint256 average) internal pure returns (uint256 value) {
    return simulateBinomial(
      seed,
      30,
      4,
      13,
      60_000_000,
      73_000_000,
      14_000
    ) * average / 100_000_000;
  }

  function simulateBinomial(
    uint256 seed, 
    uint256 n, 
    uint256 divisor,
    uint256 rightTailCutoff,
    uint256 floor,
    uint256 base,
    uint256 multiplier
  ) internal pure returns (uint256 value) {
    uint256 rolls = countRolls(seed, n, divisor);
    if(rolls > n - rightTailCutoff) rolls = n - rightTailCutoff;
    value = base * getMultiplierResult(rolls, multiplier)/(n*BASE_DENOMINATOR) + floor;
  }

  function getMultiplierResult(
    uint256 rolls,
    uint256 multiplier // scaled by BASE_DENOMINATOR
  ) internal pure returns (uint256 result) {
    // Start at multiplier^0 = 1
    result = BASE_DENOMINATOR;
    // For each roll, multiply
    for(uint i = 0; i < rolls; i++) {
      result = result * multiplier / BASE_DENOMINATOR;
    }
    result -= BASE_DENOMINATOR;
  }


  function countRolls(
    uint256 seed, 
    uint256 n, 
    uint256 divisor
  ) internal pure returns (uint256 rolls) {
    uint256 workingSeed = seed; // We keep the old seed around to generate a new seed.
    for(uint256 i = 0; i < n; i++) {
      if(workingSeed % divisor == 0) rolls++;
      // If there is not enough value left for the next roll, we make a new seed.
      if((workingSeed /= divisor) < divisor ** 4) {
        workingSeed = uint256(keccak256(abi.encode(seed, i)));
      }
    }
  }
  
}

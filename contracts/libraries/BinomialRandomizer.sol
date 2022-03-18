pragma solidity 0.8.9;


library BinomialRandomizer {

  uint256 private constant BASE_DENOMINATOR = 10_000;

  /// @notice Calculates the alchemica amount of parcels
  /// @param seed The seed to use for the randomization
  /// @param average The average value of the randomization
  /// @return totalPull A random value calculated by the binomial distribution
  /// @dev Arbitrary fields are chosen to make the distribution meet the average
  /// and provide a desirable distribution curve
  function calculateAlchemicaSurveyAmount(
    uint256 seed, 
    uint256 average
  ) internal pure returns (uint256 totalPull) {
    totalPull = simulateBinomial(
      seed,
      30, // Number of rolls
      4, // Reciprocal of the chance to win
      13, // The amount of tail to cut off to prevent a heavy tail
      60_000_000, // The floor is 60% of the average
      73_000_000, // Arbitrary
      14_000 // Arbitrary
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

  /// @notice Helper function to exponentiate the result based on the number of successful rolls
  /// @param rolls The number of successful rolls
  /// @param multiplier The multiplier to use for exponentiation
  function getMultiplierResult(
    uint256 rolls,
    uint256 multiplier // scaled by BASE_DENOMINATOR
  ) internal pure returns (uint256 result) {
    // Start at multiplier^0 = 1
    result = BASE_DENOMINATOR;
    // For each roll, multiply
    for(uint i = 0; i < rolls;) {
      result = result * multiplier / BASE_DENOMINATOR;
      unchecked {
        ++i;
      }
    }
    result -= BASE_DENOMINATOR;
  }

  /// @notice Helper function that uses the random seed to generate and count a sequence of rolls
  /// @param seed The seed to use for the randomization
  /// @param n The number of rolls to generate
  /// @param divisor The reciprocal of the chance to win
  function countRolls(
    uint256 seed, 
    uint256 n, 
    uint256 divisor
  ) internal pure returns (uint256 rolls) {
    uint256 workingSeed = seed; // We keep the old seed around to generate a new seed.
    for(uint256 i = 0; i < n;) {
      if(workingSeed % divisor == 0) rolls++;
      // If there is not enough value left for the next roll, we make a new seed.
      if((workingSeed /= divisor) < divisor ** 4) {
        workingSeed = uint256(keccak256(abi.encode(seed, i)));
      }
      unchecked {
        ++i;
      }
    }
  }
  
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IERC20 {
  function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
  function allowance(address owner, address spender) external view returns (uint256);
}

contract TokenDistributor {
  event TokensDistributed(address indexed token, address indexed distributor, uint256 totalAmountTransferred);
  event IndividualDistribution(address indexed token, address indexed recipient, uint256 amount);

  /**
   * @notice Distributes ERC20 tokens to multiple recipients.
   * @dev The caller (msg.sender) must have approved this contract to spend the tokens.
   * @param tokenAddress The address of the ERC20 token to distribute.
   * @param recipients An array of addresses to send tokens to.
   * @param amounts An array of amounts to send to each recipient. Must be same length as recipients.
   */
  function distribute(address tokenAddress, address[] calldata recipients, uint256[] calldata amounts) external {
    require(recipients.length == amounts.length, "TokenDistributor: Recipients and amounts length mismatch");
    require(recipients.length > 0, "TokenDistributor: No recipients provided");

    IERC20 token = IERC20(tokenAddress);

    for (uint256 i = 0; i < recipients.length; i++) {
      require(recipients[i] != address(0), "TokenDistributor: Invalid recipient address");
      // Allow amounts[i] == 0. If amount is 0, transferFrom is a no-op or we can skip the call.
      if (amounts[i] > 0) {
        bool success = token.transferFrom(msg.sender, recipients[i], amounts[i]);
        require(success, "TokenDistributor: ERC20 transferFrom failed");
      }
    }
  }
}

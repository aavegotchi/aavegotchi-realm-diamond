// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract BatchTransferTokens {
  error ERC20TransferFailed();

  function _batchTransferTokens(address[] memory _tokens, uint256[] memory _amounts, address _to) internal {
    require(_tokens.length == _amounts.length, "Array length mismatch");
    require(_to != address(0), "Address Zero Transfer");
    for (uint256 i; i < _tokens.length; i++) {
      address token = _tokens[i];
      uint256 amount = _amounts[i];
      bool success;
      try IERC20(token).transferFrom(msg.sender, _to, amount) {
        success;
      } catch {
        if (!success) {
          revert ERC20TransferFailed();
        }
      }
    }
  }

  function batchTransferTokens(address[][] calldata _tokens, uint256[][] calldata _amounts, address[] calldata _to) external {
    require(_tokens.length == _amounts.length, "Array length mismatch");
    require(_to.length == _amounts.length, "Array length mismatch");
    for (uint256 i; i < _to.length; i++) {
      _batchTransferTokens(_tokens[i], _amounts[i], _to[i]);
    }
  }
}

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "forge-std/Test.sol";

abstract contract Helpers is Test {
  function constructSig(
    uint256 _realmId,
    uint256 _gotchiId,
    uint256 _installationId,
    uint256 _x,
    uint256 _y,
    uint256 privKey
  ) public returns (bytes memory sig) {
    bytes32 mHash = keccak256(abi.encodePacked(_realmId, _gotchiId, _installationId, _x, _y));
    mHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", mHash));
    //  emit log_bytes32(mHash);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(privKey, mHash);
    sig = getSig(v, r, s);
  }

  function getSig(
    uint8 v,
    bytes32 r,
    bytes32 s
  ) public pure returns (bytes memory sig) {
    sig = bytes.concat(r, s, bytes1(v));
  }

  function fromHex(string memory s) public pure returns (bytes memory) {
    bytes memory ss = bytes(s);
    require(ss.length % 2 == 0); // length must be even
    bytes memory r = new bytes(ss.length / 2);
    for (uint256 i = 0; i < ss.length / 2; ++i) {
      r[i] = bytes1(fromHexChar(uint8(ss[2 * i])) * 16 + fromHexChar(uint8(ss[2 * i + 1])));
    }
    return r;
  }

  function fromHexChar(uint8 c) public pure returns (uint8) {
    if (bytes1(c) >= bytes1("0") && bytes1(c) <= bytes1("9")) {
      return c - uint8(bytes1("0"));
    }
    if (bytes1(c) >= bytes1("a") && bytes1(c) <= bytes1("f")) {
      return 10 + c - uint8(bytes1("a"));
    }
    if (bytes1(c) >= bytes1("A") && bytes1(c) <= bytes1("F")) {
      return 10 + c - uint8(bytes1("A"));
    }
  }
}

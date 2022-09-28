// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import {LibMeta} from "../../libraries/LibMeta.sol";
import {Modifiers, Whitelist} from "../../libraries/AppStorage.sol";
import {LibWhitelist} from "../../libraries/LibWhitelist.sol";

contract WhitelistFacet is Modifiers {
  event WhitelistCreated(uint256 indexed whitelistId);
  event WhitelistUpdated(uint256 indexed whitelistId);
  event WhitelistOwnershipTransferred(uint256 indexed whitelistId, address indexed newOwner);

  function createWhitelist(string calldata _name, address[] calldata _whitelistAddresses) external {
    require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
    require(bytes(_name).length > 0, "WhitelistFacet: Whitelist name cannot be blank");

    uint256 whitelistId = LibWhitelist.getNewWhitelistId();
    address[] memory addresses;
    Whitelist memory whitelist = Whitelist({owner: LibMeta.msgSender(), name: _name, addresses: addresses});

    s.whitelists.push(whitelist);

    LibWhitelist._addAddressesToWhitelist(whitelistId, _whitelistAddresses);

    emit WhitelistCreated(whitelistId);
  }

  function updateWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external {
    require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
    require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
    require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

    LibWhitelist._addAddressesToWhitelist(_whitelistId, _whitelistAddresses);

    emit WhitelistUpdated(_whitelistId);
  }

  function removeAddressesFromWhitelist(uint256 _whitelistId, address[] calldata _whitelistAddresses) external {
    require(_whitelistAddresses.length > 0, "WhitelistFacet: Whitelist length should be larger than zero");
    require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
    require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

    LibWhitelist._removeAddressesFromWhitelist(_whitelistId, _whitelistAddresses);

    emit WhitelistUpdated(_whitelistId);
  }

  function transferOwnershipOfWhitelist(uint256 _whitelistId, address _whitelistOwner) external {
    require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
    require(LibWhitelist.checkWhitelistOwner(_whitelistId), "WhitelistFacet: Not whitelist owner");

    Whitelist storage whitelist = LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);

    whitelist.owner = _whitelistOwner;

    emit WhitelistOwnershipTransferred(_whitelistId, _whitelistOwner);
  }

  function whitelistExists(uint256 whitelistId) external view returns (bool exists) {
    exists = LibWhitelist._whitelistExists(whitelistId);
  }

  function isWhitelisted(uint256 _whitelistId, address _whitelistAddress) external view returns (uint256) {
    return s.isWhitelisted[_whitelistId][_whitelistAddress];
  }

  function getWhitelistsLength() external view returns (uint256) {
    return s.whitelists.length;
  }

  function getWhitelist(uint256 _whitelistId) external view returns (Whitelist memory) {
    require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
    return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId);
  }

  function whitelistOwner(uint256 _whitelistId) external view returns (address) {
    require(LibWhitelist._whitelistExists(_whitelistId), "WhitelistFacet: Whitelist not found");
    return LibWhitelist.getWhitelistFromWhitelistId(_whitelistId).owner;
  }
}

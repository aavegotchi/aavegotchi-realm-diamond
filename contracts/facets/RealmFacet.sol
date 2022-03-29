// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../libraries/AppStorage.sol";
import "../libraries/LibDiamond.sol";
import "../libraries/LibStrings.sol";
import "../libraries/LibMeta.sol";
import "../libraries/LibERC721.sol";
import {InstallationDiamond} from "../interfaces/InstallationDiamond.sol";
import "../interfaces/IERC721.sol";
import "../interfaces/IERC20Mintable.sol";
import "../interfaces/AavegotchiDiamond.sol";

contract RealmFacet is Modifiers {
  uint256 constant MAX_SUPPLY = 420069;

  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    string parcelId;
    string parcelAddress;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] boost; //fud, fomo, alpha, kek
  }

  event ResyncParcel(uint256 _tokenId);

  function maxSupply() external pure returns (uint256) {
    return MAX_SUPPLY;
  }

  function mintParcels(
    address _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      require(s.tokenIds.length < MAX_SUPPLY, "RealmFacet: Cannot mint more than 420,069 parcels");
      uint256 tokenId = _tokenIds[index];
      MintParcelInput memory metadata = _metadata[index];
      require(_tokenIds.length == _metadata.length, "Inputs must be same length");

      Parcel storage parcel = s.parcels[tokenId];
      parcel.coordinateX = metadata.coordinateX;
      parcel.coordinateY = metadata.coordinateY;
      parcel.parcelId = metadata.parcelId;
      parcel.size = metadata.size;
      parcel.district = metadata.district;
      parcel.parcelAddress = metadata.parcelAddress;

      parcel.alchemicaBoost = metadata.boost;

      LibERC721.safeMint(_to, tokenId);
    }
  }

  struct ParcelOutput {
    string parcelId;
    string parcelAddress;
    address owner;
    uint256 coordinateX; //x position on the map
    uint256 coordinateY; //y position on the map
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256 district;
    uint256[4] boost;
  }

  /**
  @dev Used to resync a parcel on the subgraph if metadata is added later 
  */
  function resyncParcel(uint256[] calldata _tokenIds) external onlyOwner {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
      emit ResyncParcel(_tokenIds[index]);
    }
  }

  /// @notice Allow the diamond owner to set some important diamond state variables
  /// @param _aavegotchiDiamond The address of the aavegotchi diamond
  /// @param _alchemicaAddresses The four alchemica token addresses
  function setVars(address _aavegotchiDiamond, address[4] calldata _alchemicaAddresses) external onlyOwner {
    s.aavegotchiDiamond = _aavegotchiDiamond;
    s.alchemicaAddresses = _alchemicaAddresses;
  }

  function getParcelInfo(uint256 _tokenId) external view returns (ParcelOutput memory output_) {
    Parcel storage parcel = s.parcels[_tokenId];
    output_.parcelId = parcel.parcelId;
    output_.owner = parcel.owner;
    output_.coordinateX = parcel.coordinateX;
    output_.coordinateY = parcel.coordinateY;
    output_.size = parcel.size;
    output_.parcelAddress = parcel.parcelAddress;
    output_.district = parcel.district;
    output_.boost = parcel.alchemicaBoost;
  }

  function batchTransferTokensToGotchis(
    uint256[] calldata _gotchiIds,
    address[] calldata _tokenAddresses,
    uint256[][] calldata _amounts
  ) external {
    require(_gotchiIds.length == _amounts.length, "RealmFacet: Mismatched array lengths");
    require(_tokenAddresses.length == _amounts.length, "RealmFacet: Mismatched array lengths");

    for (uint256 i = 0; i < _gotchiIds.length; i++) {
      for (uint256 j = 0; j < _amounts[i].length; j++) {
        uint256 amount = _amounts[i][j];
        if (amount > 0) {
          IERC20(_tokenAddresses[j]).transferFrom(msg.sender, alchemicaRecipient(_gotchiIds[i]), amount);
        }
      }
    }
  }

  /// @notice Helper function to batch transfer alchemica
  /// @param _targets Array of target addresses
  /// @param _amounts Nested array of amounts to transfer.
  /// @dev The inner array element order for _amounts is FUD, FOMO, ALPHA, KEK
  function batchTransferAlchemica(address[] calldata _targets, uint256[4][] calldata _amounts) external {
    require(_targets.length == _amounts.length, "AlchemicaFacet: Mismatched array lengths");

    IERC20Mintable[4] memory alchemicas = [
      IERC20Mintable(s.alchemicaAddresses[0]),
      IERC20Mintable(s.alchemicaAddresses[1]),
      IERC20Mintable(s.alchemicaAddresses[2]),
      IERC20Mintable(s.alchemicaAddresses[3])
    ];

    for (uint256 i = 0; i < _targets.length; i++) {
      for (uint256 j = 0; j < _amounts[i].length; j++) {
        if (_amounts[i][j] > 0) {
          alchemicas[j].transferFrom(msg.sender, _targets[i], _amounts[i][j]);
        }
      }
    }
  }

  function alchemicaRecipient(uint256 _gotchiId) internal view returns (address) {
    AavegotchiDiamond diamond = AavegotchiDiamond(s.aavegotchiDiamond);

    return diamond.ownerOf(_gotchiId);
  }
}

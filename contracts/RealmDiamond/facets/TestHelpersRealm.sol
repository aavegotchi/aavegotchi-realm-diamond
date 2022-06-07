// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.9;

import "../../libraries/AppStorage.sol";
import "../../interfaces/IERC20Mintable.sol";
import "../../libraries/LibERC721.sol";
import "../../test/GlmrMock.sol";

// This facet should not be deployed in production
contract TestHelpersRealm is Modifiers {
  function testMintAlchemica(
    address _to,
    uint256 _alchemicaType,
    uint256 _amount
  ) external {
    IERC20Mintable alchemica = IERC20Mintable(s.alchemicaAddresses[_alchemicaType]);
    alchemica.mint(_to, _amount);
  }

  struct MintParcelInput {
    uint256 coordinateX;
    uint256 coordinateY;
    uint256 district;
    string parcelId;
    string parcelAddress;
    uint256 size; //0=humble, 1=reasonable, 2=spacious vertical, 3=spacious horizontal, 4=partner
    uint256[4] boost; //fud, fomo, alpha, kek
  }

  function testMintGLTR(address _to, uint256 _value) external {
    GLTR(s.gltrAddress).mint(_value);
    GLTR(s.gltrAddress).transfer(_to, _value);
  }

  function testMintParcels(
    address _to,
    uint256[] calldata _tokenIds,
    MintParcelInput[] memory _metadata
  ) external {
    for (uint256 index = 0; index < _tokenIds.length; index++) {
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
}

const { h2tokenIds } = require("./data/h2tokenIds");

interface AuctionPreset {
  startTime: number;
  endTime: number;
  hammerTimeDuration: number;
  bidDecimals: number;
  stepMin: number;
  incMin: number;
  incMax: number;
  bidMultiplier: number;
}

interface TokenCounts {
  none: number;
  low: number;
  medium: number;
  high: number;
  degen: number;
  test: number;
}

interface AuctionPresets {
  none: AuctionPreset;
  low: AuctionPreset;
  medium: AuctionPreset;
  high: AuctionPreset;
  degen: AuctionPreset;
  test: AuctionPreset;
}

interface AuctionERC721Config {
  id: string;
  ercType: number;

  // auction params
  auctionTokenCounts: TokenCounts;
  auctionPresets: AuctionPresets;

  // if prexisiting listing
  initialIndex: number;

  //
  token: string;
  tokenId: number; // index to start auctioning from if 721
  // or its the wearables id if erc 1155

  // gbm deployment params
  gbm: string;
}

interface AuctionERC1155Config {
  // a identifier helpful for humans
  id: string;
  ercType: number;
  // auction params
  auctionCount: number;
  // if prexisiting listing
  initialIndex: number;

  //
  token: string;
  tokenId: number; // index to start auctioning from if 721
  // or its the wearables id if erc 1155

  // gbm deployment params
  gbm: string;
}

// export default <AuctionConfig>{
//   id: "auction-haunt2-test", // huamn id
//   auctionCount: 502, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   ercType: 1155,
//   tokenId: 18, // if erc721, tokenId == 0
//   skip: 0,
//   token: "", // if erc
//   gbmInitiator: "",
//   gbm: "",
// };

export default <AuctionERC721Config>{
  id: "auction-haunt2-test", // huamn id
  auctionPresets: {
    none: {
      startTime: Date.now(),
      endTime: Date.now() + 86400 * 3,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 5000,
      incMin: 0,
      incMax: 0,
      bidMultiplier: 0,
    },
    low: {
      startTime: 0,
      endTime: 0,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 5000,
      incMin: 500,
      incMax: 5000,
      bidMultiplier: 5080,
    },
    medium: {
      startTime: Date.now(),
      endTime: Date.now() + 86400 * 3,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 10000,
      incMin: 1000,
      incMax: 10000,
      bidMultiplier: 11120,
    },
    high: {
      startTime: Date.now(),
      endTime: Date.now() + 86400 * 3,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 15000,
      incMin: 1500,
      incMax: 15000,
      bidMultiplier: 18700,
    },
    degen: {
      startTime: Date.now(),
      endTime: Date.now() + 86400 * 3,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 30000,
      incMin: 3000,
      incMax: 30000,
      bidMultiplier: 48740,
    },
    test: {
      startTime: Date.now(),
      endTime: Date.now() + 86400 * 3,
      hammerTimeDuration: 1200,
      bidDecimals: 100000,
      stepMin: 30000,
      incMin: 3000,
      incMax: 30000,
      bidMultiplier: 48740,
    },
  },
  auctionTokenCounts: {
    none: h2tokenIds.none.length,
    low: h2tokenIds.low.length,
    medium: h2tokenIds.medium.length,
    high: h2tokenIds.high.length,
    degen: h2tokenIds.degen.length,
    test: h2tokenIds.test.length,
  },

  initialIndex: 0, // none previous, so start at 0
  ercType: 721,
  tokenId: 0, // if erc721, tokenId == 0
  skip: 0,
  token: "", // if erc
  gbmInitiator: "",
  gbm: "",
};

// const erc721 = <AuctionConfig>{
//   id: "auction-haunt2-test", // huamn id
//   auctionCount: 1000, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   token: "", // if erc
//   ercType: 721,
//   tokenId: 0,
//   gbmInitiator: "",
//   gbm: "",
// };
//
// const erc1155 = <AuctionConfig>{
//   id: "auction-wearable-test", // huamn id
//   auctionCount: 1000, // number of auctions to make
//   initialIndex: 0, // none previous, so start at 0
//   token: "", // if erc
//   ercType: 1155,
//   tokenId: 100,
//   gbmInitiator: "",
//   gbm: "",
// };

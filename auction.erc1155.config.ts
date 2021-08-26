export interface ERC1155Config {
  id?: string;
  auctions?: Object;
  gbm: string;
  gbmInitiator: string;
  token: string;
  ghst?: string;
  gasGwei?: number;
  release?: boolean;
}

interface Config {
  default: ERC1155Config;
  hardhat?: ERC1155Config;
  kovan?: ERC1155Config;
  mumbai?: ERC1155Config;
  polygon?: ERC1155Config;
}

export default <Config>{
  default: {
    id: "auction-wearable-h2-localtest",
    auctions: {
      // svgId: quanity of items to take from owner and regiser for auction
      // 206: 210, // biker helmet, -40 sold on venly
      // 207: 495, // biker jacket, -5 sold on venly
      // 208: 399, // aaviators, -101 sold on venly
      // 209: 77, // horsehoe mustache, -23 sold on venly
      211: 1000, // guy fawkes mask
      212: 50, // 1337 laptop
      213: 100, // haxxor shirt
      214: 5, // matrix eyes
      215: 100, // cyborg eyes
      216: 50, // rainbow vomit,
      217: 50, // energy gun,
      218: 500, // mohawk,
      219: 250, // mutton chops,
      220: 100, // punk shirt
      221: 1000, // pirate hat
      222: 500, // pirate coat
      223: 500, // hook hank
      224: 250, // pirate patch
      225: 1000, // basketball
      226: 250, // red headband
      227: 250, // 23 jersey
      228: 1000, // 10 gallon hat
      229: 500, // lasso
      230: 1000, // wrangler jeans
      231: 500, // comfy poncho
      232: 1000, // poncho hoodie
      233: 500, // uncommon cacti
      234: 50, // shaman poncho
      235: 100, // shaman hoodie
      236: 250, // blue cacti
      237: 50, // mythical cacti
      238: 5, // godlike cacti
      239: 500, // wagie cap,
      240: 500, //headphones,
      241: 250, // wgmi shirt
      242: 100, // yellow manbun
      243: 250, // tinted shades,
      244: 250, // v-neck shirt
    },
    //  gasGwei: 30,
    release: false,
    ghst: "0x385Eeac5cB85A38A9a07A70c73e0a3271CfB54A7",
    token: "",
    gbm: "",
    gbmInitiator: "",
  },
  hardhat: {
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
    gasGwei: 2,
  },
  localhost: {
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
    gasGwei: 2,
  },
  kovan: {
    id: "auction-wearables-h2-testnet",
    gbm: "",
    gbmInitiator: "",
    token: "",
    ghst: "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5",
    gasGwei: 2,
    release: true,
  },
  matic: {
    id: "auction-wearables-h2",
    gbm: "",
    gbmInitiator: "",
    token: "0x86935F11C86623deC8a25696E1C19a8659CbF95d",
    ghst: "0x385eeac5cb85a38a9a07a70c73e0a3271cfb54a7",
    gasGwei: 30,
    release: true,
  },
  // mainnet kovan
  // kovan: {
  // gbm: "0xC025B341fF094958179d6acdddBD86042430DE1d",
  // gbmInitiator: "0x3EF3b22917D663ECE1896F98251fa44d96052e07",
  // token: "0x07543dB60F19b9B48A69a7435B5648b46d4Bb58E",
  // ghst: "0xeDaA788Ee96a0749a2De48738f5dF0AA88E99ab5",
  // gasGwei: 30,
  // release: true // confirm you really want to deploy using non-dummy addresses
  // }
};

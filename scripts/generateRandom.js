/*
0 -> none
1 -> Low
2 -> Medium
3 -> High
*/
function pseudoRandomNumberGenerator(tokenId) {
  const primeNumber = 1870933;
  const moduloNumber = 30000;
  const tenPercents = moduloNumber / 10;
  const thirtyPercents = (moduloNumber - tenPercents) / 3;
  const p2 = primeNumber;
  const r1 = tokenId ^ p2;
  const remainder = (r1 * primeNumber) % moduloNumber;
  if (remainder < tenPercents) {
    return 0;
  }
  if (remainder < tenPercents + thirtyPercents) {
    return 1;
  }
  if (remainder < tenPercents + 2 * thirtyPercents) {
    return 2;
  } else {
    return 3;
  }
}

const degen = [
  10000, 11000, 12000, 13000, 14000, 15000, 16000, 17000, 18000, 19000, 20000,
  21000, 21999, 11111, 12221, 13331, 14441, 15551, 16661, 17771, 18881, 19991,
  20002, 21112, 12321, 13431, 14541, 15651, 16761, 17871, 19891, 21012, 10101,
  10201, 10301, 10401, 10501, 10601, 10701, 10801, 10901, 11211, 11311, 11411,
  11511, 11611, 11711, 11811, 11911, 21212, 21312, 21412, 21512, 21612, 21712,
  21812, 21912, 20102, 20202, 20302, 20402, 20502, 20602, 20702, 20802, 20902,
  11011, 12012, 13013, 14014, 15015, 16016, 17017, 18018, 19019, 20020, 21021,
  10001, 11001, 12001, 13001, 14001, 15001, 16001, 17001, 18001, 19001, 20001,
  21001, 10999, 11999, 12999, 13999, 14999, 15999, 16999, 17999, 18888, 18999,
  19999
];

let none = [];
let low = [];
let medium = [];
let high = [];

function generateRndAndSort() {
  let arr = Array.from(Array(12000), (x, i) => i + 10001);
  arr = arr.filter(element => !degen.includes(element));
  arr.forEach(element => {
    const rnd = pseudoRandomNumberGenerator(element);
    switch (rnd) {
      case 0:
        none.push(element);
        break;
      case 1:
        low.push(element);
        break;
      case 2:
        medium.push(element);
        break;
      default:
        high.push(element);
    }
  });
  console.log("none", JSON.stringify(none));
  console.log("low", JSON.stringify(low));
  console.log("medium", JSON.stringify(medium));
  console.log("high", JSON.stringify(high));

  return new Promise((resolve, reject) => {
    resolve("Success!");
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
if (require.main === module) {
  generateRndAndSort()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

exports.generateRandom = generateRndAndSort;

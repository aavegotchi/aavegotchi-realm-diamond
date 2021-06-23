
module.exports = {


  networks: {

  },


  mocha: {

  },

  compilers: {
    solc: {
      version: "0.8.5",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      },
    }
  }

};

require("ts-node").register({files: true,});
require('source-map-support').install({hookRequire: true});
require('dotenv').config();
const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  networks: {
    goerli: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.GOERLI_PK],
          providerOrUrl: 'https://goerli.infura.io/v3/' + process.env.INFURA_KEY
          });
      },
      network_id: '5', // eslint-disable-line camelcase
      gasPrice: 10e9,
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider({
          privateKeys: [process.env.KOVAN_PK],
          providerOrUrl: 'https://kovan.infura.io/v3/' + process.env.INFURA_KEY
        });
      },
      network_id: '42',
      gas: 8000000,
      gasPrice: 10e9,
    },
    mainnet: {
      provider: function() {
        return new HDWalletProvider({
          privateKeys: [process.env.MAINNET_PK],
          providerOrUrl: 'https://mainnet.infura.io/v3/' + process.env.INFURA_KEY
          });
      },
      gas: 2000000,
      gasPrice: 70e9,
      network_id: 1
    }
  },
  compilers: {
    solc: {
      version: "^0.8",
    }
  }
};

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("hardhat-deploy");
require("solidity-coverage");
require("hardhat-gas-reporter");
require("hardhat-contract-sizer");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const RINKEBY_RPC_URL = process.env.RINKEBY_RPC_URL;
const PRIVATE_KEY_RINKEBY = process.env.PRIVATE_KEY_RINKEBY;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const ARBITRUM_RPC_URL = process.env.ARBITRUM_RPC_URL;
const MAINNET_RPC_URL = process.env.MAINNET_RPC_URL;
const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL;

module.exports = {
    solidity: {
        compilers: [
            { version: "0.8.9" },
            { version: "0.4.19" },
            { version: "0.6.12" },
            { version: "0.6.0" },
        ],
    },
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            chainId: 31337,
            blockConfirmations: 1,
        },
        rinkeby: {
            url: RINKEBY_RPC_URL,
            accounts: [PRIVATE_KEY_RINKEBY],
            chainId: 4,
            blockConfirmations: 6,
        },
        arbitrum: {
            url: "https://arb-mainnet.g.alchemy.com/v2/YKfPwrPkRmIJI--7SxBAcJOsWx01jNpc",
            accounts: [PRIVATE_KEY_RINKEBY],
            chainId: 42161,
            blockConfirmations: 6,
        },
        localhost: {
            chainId: 31337,
            url: "http://127.0.0.1:8545/",
            //accounts: Thx hardhat haha!
            blockConfirmations: 1,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY_RINKEBY],
            chainId: 5,
            blockConfirmations: 6,
        },
    },
    etherscan: {
        apiKey: {
            rinkeby: ETHERSCAN_API_KEY,
            goerli: ETHERSCAN_API_KEY,
        },
    },
    gasReporter: {
        enabled: true,
        currency: "USD",
        outputFile: "gas-report.txt",
        noColors: true,
        coinmarketcap: COINMARKETCAP_API_KEY,
        token: "ETH",
    },
    namedAccounts: {
        deployer: {
            default: 0,
        },
        player: {
            default: 1,
        },
    },
    mocha: {
        timeout: 300000, //Thats miliseconds = 200 secondsd max
    },
};

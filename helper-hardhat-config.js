const networkConfig = {
    31337: {
        name: "localhost",
        subscriptionId: "1249",
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15",
        interval: "30",
        callbackGasLimit: "500000", //500,000 gas
        mintFee: "10000000000000000", //0.01
    },
    42: {
        name: "kovan",
        ethUsdPriceFeed: "0x9326BFA02ADD2366b30bacB125260Af641031331",
    },
    4: {
        name: "rinkeby",
        ethUsdPriceFeed: "0x8A753747A1Fa494EC906cE90E9f37563A8AF630e",
    },
    5: {
        name: "goerli",
        subscriptionId: "1249",
        gasLane:
            "0x79d3d8832d904592c0bf9818b621522c988bb8b0c05cdc3b15aea1b6e8db0c15", // 30gwei Key Hash
        interval: "30",
        callbackGasLimit: "500000", //500,000 gas
        vrfCoordinatorV2: "0x2Ca8E0C643bDe4C2E08ab1fA0da3401AdAD7734D",
        mintFee: "10000000000000000", //0.01
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e",
    },
};

const developmentChains = ["hardhat", "localhost"];
const DECIMALS = "8";
const INITIAL_PRICE = "200000000000";

module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_PRICE,
};

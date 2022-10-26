const { ethers } = require("hardhat");
const { moveBlocks } = require("../utils/move-blocks");

const TOKEN_ID = 10;
const PRICE = ethers.utils.parseEther("0.5");

async function updatePrice() {
    const nftMarketplace = await ethers.getContract("NftMarketplace");
    const basicNft = await ethers.getContract("BasicNft");
    const tx = await nftMarketplace.updatePrice(
        basicNft.address,
        TOKEN_ID,
        PRICE
    );
    await tx.wait(1);
    console.log(`Price updated to ${PRICE} for token ${TOKEN_ID}`);
    if (network.config.chainId == "31337") {
        await moveBlocks(2, (sleepAmount = 1000));
    }
}

updatePrice()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });

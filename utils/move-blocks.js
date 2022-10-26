const { network } = require("hardhat");

function sleep(timeInMs) {
    return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

async function moveBlocks(amount, sleepAmount = 0) {
    console.log("Moving blocks...");
    for (let index = 0; index < amount; index++) {
        await network.provider.request({
            method: "evm_mine",
            params: [],
        });
        if (sleepAmount) {
            console.log(`Sleeping for ${sleepAmount}`);
            //As sleep returns a promise we can call it with await, and it will only finish when the
            //time in ms is over
            await sleep(sleepAmount);
        }
    }
}

module.exports = {
    moveBlocks,
    sleep,
};

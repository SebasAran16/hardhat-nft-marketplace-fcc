const { assert, expect } = require("chai");
const { network, developments, ethers, deployments } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("NFT Marketplace Unit Test", async function () {
          let nftMarketplace, deployer, basicNft, user;
          const TOKEN_ID = 0;
          const PRICE = ethers.utils.parseEther("0.1");
          const NEW_PRICE = ethers.utils.parseEther("0.2");
          const ZERO = ethers.constants.AddressZero;

          beforeEach(async function () {
              accounts = await ethers.getSigners();
              deployer = accounts[0];
              user = accounts[1];
              await deployments.fixture(["all"]);
              nftMarketplaceContract = await ethers.getContract(
                  "NftMarketplace"
              );
              nftMarketplace = await nftMarketplaceContract.connect(deployer);
              basicNftContract = await ethers.getContract("BasicNft");
              basicNft = await basicNftContract.connect(deployer);
              await basicNft.mintNft();
              await basicNft.approve(nftMarketplaceContract.address, TOKEN_ID);
          });

          describe("listItem", async function () {
              it("Emits the event when completed", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.emit(nftMarketplace, "ItemList");
              });
              it("Reverts when listing listed item", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      `NftMarketplace__AlreadyListed("${basicNft.address}", ${TOKEN_ID})`
                  );
              });
              it("Reverts when price is not higher than zero", async function () {
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, 0)
                  ).to.be.revertedWith(
                      "NftMarketplace__PriceMustBeAboveZero()"
                  );
              });
              it("Reverts when the Marketplace is not approved", async function () {
                  await basicNft.approve(ZERO, TOKEN_ID);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith(
                      `NftMarketplace__NotApprovedForMarketplace("${await basicNft.getApproved(
                          TOKEN_ID
                      )}", "${nftMarketplaceContract.address}")`
                  );
              });
              it("Reverts when not owner calls the function", async function () {
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await basicNft.approve(user.address, TOKEN_ID);
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKEN_ID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner");
              });
              it("Checks that the token was successfully listed", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price, PRICE.toString());
                  assert.equal(listing.seller, deployer.address);
              });
          });
          describe("buyItem", async function () {
              it("Reverts when the item is not listed", async function () {
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(
                      `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  );
              });
              it("Reverts when the price is not met", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await expect(
                      nftMarketplace.buyItem(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(
                      `NftMarketplace__PriceNotMet("${basicNft.address}", ${TOKEN_ID}, ${PRICE})`
                  );
              });
              it("Check that the event emits, the listing is errase, owner changes and seller proceeds are updated", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  expect(
                      await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                          value: PRICE,
                      })
                  ).to.emit(nftMarketplace, "ItemBought");
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price, 0);
                  assert.equal(listing.seller, ZERO);
                  const owner = await basicNft.ownerOf(TOKEN_ID);
                  assert.equal(owner.toString(), user.address);
                  nftMarketplace = await nftMarketplaceContract.connect(
                      deployer
                  );
                  const proceeds = await nftMarketplace.getProceeds();
                  assert.equal(proceeds.toString(), PRICE.toString());
              });
          });
          describe("cancelListing", async function () {
              it("Checks that only the owner can unlist", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner()");
              });
              it("Checks that only listed items can be cancelled", async function () {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.be.revertedWith(
                      `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  );
              });
              it("Checks that the listing is deleted and the event emits", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKEN_ID)
                  ).to.emit(nftMarketplace, "ItemCanceled");
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price, 0);
                  assert.equal(listing.seller, ZERO);
              });
          });
          describe("updatePrice", async function () {
              it("Checks that only the owner can change price", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await expect(
                      nftMarketplace.updatePrice(
                          basicNft.address,
                          TOKEN_ID,
                          NEW_PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner()");
              });
              it("Checks price can be changed just for listed items", async function () {
                  await expect(
                      nftMarketplace.updatePrice(
                          basicNft.address,
                          TOKEN_ID,
                          NEW_PRICE
                      )
                  ).to.be.revertedWith(
                      `NftMarketplace__NotListed("${basicNft.address}", ${TOKEN_ID})`
                  );
              });
              it("Checks that the event emits and the listing changes", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  expect(
                      await nftMarketplace.updatePrice(
                          basicNft.address,
                          TOKEN_ID,
                          NEW_PRICE
                      )
                  ).to.emit(nftMarketplace, "PriceUpdated");
                  const listing = await nftMarketplace.getListing(
                      basicNft.address,
                      TOKEN_ID
                  );
                  assert.equal(listing.price.toString(), NEW_PRICE);
                  assert.equal(listing.seller.toString(), deployer.address);
              });
          });
          describe("withdraw", async function () {
              it("Checks that 0 proceeds can not withdraw", async function () {
                  await expect(nftMarketplace.withdraw()).to.be.revertedWith(
                      "NftMarketplace__NoProceeds()"
                  );
              });
              it("Check the proceeds are withdrawn right", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  });
                  nftMarketplace = await nftMarketplaceContract.connect(
                      deployer
                  );
                  const proceedsBefore = await nftMarketplace.getProceeds();
                  const balanceBefore = await deployer.getBalance();
                  const txResponse = await nftMarketplace.withdraw();
                  const txReceipt = await txResponse.wait(1);
                  const { gasUsed, effectiveGasPrice } = txReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const deployerBalanceAfter = await deployer.getBalance();

                  assert(
                      deployerBalanceAfter.add(gasCost).toString() ==
                          proceedsBefore.add(balanceBefore).toString()
                  );
              });
              it("Checks that the event emits", async function () {
                  await nftMarketplace.listItem(
                      basicNft.address,
                      TOKEN_ID,
                      PRICE
                  );
                  nftMarketplace = await nftMarketplaceContract.connect(user);
                  await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
                      value: PRICE,
                  });
                  nftMarketplace = await nftMarketplaceContract.connect(
                      deployer
                  );
                  expect(await nftMarketplace.withdraw()).to.emit(
                      nftMarketplace,
                      "Withdrawal"
                  );
              });
          });
      });

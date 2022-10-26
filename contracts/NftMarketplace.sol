//SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

error NftMarketplace__PriceMustBeAboveZero();
error NftMarketplace__NotApprovedForMarketplace(
    address Set,
    address Marketplace
);
error NftMarketplace__AlreadyListed(address nftAddress, uint256 tokenId);
error NftMarketplace__NotOwner();
error NftMarketplace__NotListed(address nftAddress, uint256 tokenId);
error NftMarketplace__PriceNotMet(
    address tokenAddress,
    uint256 tokenId,
    uint256 price
);
error NftMarketplace__NoProceeds();
error NftMarketplace__TransferFailed();

contract NftMarketplace {
    // 1. List NFTs ✅
    // 2. Buy NFTs ✅
    // 3. Cancel Listing ✅
    // 4. Update Listing price ✅
    // 5. Withdraw payment from NFTs sold ✅

    struct Listing {
        uint256 price;
        address seller;
    }

    event ItemList(
        address indexed seller,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed buyer,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCanceled(
        address indexed owner,
        address indexed tokenAddress,
        uint256 indexed tokenId
    );

    event PriceUpdated(
        address changer,
        address tokenAddress,
        uint256 tokenId,
        uint256 newPrice
    );

    event Withdrawal(address indexed owner, uint256 indexed proceeds);

    //NFT Contract Address -> NFT TokenId -> Listing
    mapping(address => mapping(uint256 => Listing)) private s_listings;
    // Seller address to amount earned
    mapping(address => uint256) private s_proceeds;

    ///////////////
    // MODIFIERS //
    ///////////////

    modifier onlyUnlisted(
        address tokenAddress,
        uint256 tokenId,
        address owner
    ) {
        Listing memory listing = s_listings[tokenAddress][tokenId];
        if (listing.price > 0) {
            revert NftMarketplace__AlreadyListed(tokenAddress, tokenId);
        }
        _;
    }

    modifier isOwner(
        address nftAddress,
        uint256 tokenId,
        address spender
    ) {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        if (spender != owner) {
            revert NftMarketplace__NotOwner();
        }
        _;
    }

    modifier isListed(address nftAddress, uint256 tokenId) {
        Listing memory listing = s_listings[nftAddress][tokenId];
        if (listing.price <= 0) {
            revert NftMarketplace__NotListed(nftAddress, tokenId);
        }
        _;
    }

    modifier holdFunds(address holder) {
        if (s_proceeds[holder] <= 0) {
            revert NftMarketplace__NoProceeds();
        }
        _;
    }

    ////////////////////
    // MAIN FUNCTIONS //
    ////////////////////

    /**
     * @notice Listing your NFT to the marketplace
     * @param nftAddress The address of the token that will be listed
     * @param tokenId The IF of the token
     * @param price The price in uint of the token
     * @dev This prevents non owners of the token to list and also checks the token has not been listed, price must be above 0.
     * People will still have tokens in their Wallets this way...
     */
    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        onlyUnlisted(nftAddress, tokenId, msg.sender)
        isOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketplace__PriceMustBeAboveZero();
        }
        // We can do this in two ways (I have seen both of them):
        //  1. Send the NFT to the contract, so the contract would "hold" the piece. (Const more gas)
        //  2. Owners do an apprroval to the marketplace so they keep their piece but we can sell it if they
        //  do not cancel the approval.abi

        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketplace__NotApprovedForMarketplace({
                Set: nft.getApproved(tokenId),
                Marketplace: address(this)
            });
        }
        //Array or Mapping? -> Mapping (Array would be huge and more complicated...)
        s_listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemList(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(address nftAddress, uint256 tokenId)
        external
        payable
        isListed(nftAddress, tokenId)
    {
        Listing memory listedItem = s_listings[nftAddress][tokenId];
        if (msg.value < listedItem.price) {
            revert NftMarketplace__PriceNotMet(
                nftAddress,
                tokenId,
                listedItem.price
            );
        }
        s_proceeds[listedItem.seller] += msg.value;
        delete (s_listings[nftAddress][tokenId]);
        IERC721(nftAddress).safeTransferFrom(
            listedItem.seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(msg.sender, nftAddress, tokenId, listedItem.price);
    }

    function cancelListing(address nftAddress, uint256 tokenId)
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        delete (s_listings[nftAddress][tokenId]);
        emit ItemCanceled(msg.sender, nftAddress, tokenId);
    }

    function updatePrice(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        isOwner(nftAddress, tokenId, msg.sender)
        isListed(nftAddress, tokenId)
    {
        s_listings[nftAddress][tokenId].price = newPrice;
        emit PriceUpdated(msg.sender, nftAddress, tokenId, newPrice);
    }

    function withdraw() external holdFunds(msg.sender) {
        uint256 balances = s_proceeds[msg.sender];
        if (address(this).balance >= balances) {
            s_proceeds[msg.sender] = 0;
            (bool success, ) = msg.sender.call{value: balances}("");
            if (!success) {
                revert NftMarketplace__TransferFailed();
            }
        }
        emit Withdrawal(msg.sender, balances);
    }

    //////////////////////
    // GETTER FUNCTIONS //
    //////////////////////

    function getListing(address nftAddress, uint256 tokenId)
        public
        view
        returns (Listing memory)
    {
        return s_listings[nftAddress][tokenId];
    }

    function getItemPrice(address nftAddress, uint256 tokenId)
        public
        view
        returns (uint256)
    {
        return s_listings[nftAddress][tokenId].price;
    }

    function getProceeds() public view returns (uint256) {
        return s_proceeds[msg.sender];
    }

    function getOwner(address nftAddress, uint256 tokenId)
        public
        view
        returns (address)
    {
        IERC721 nft = IERC721(nftAddress);
        address owner = nft.ownerOf(tokenId);
        return owner;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "hardhat/console.sol";

contract YourContract {
    address public immutable owner;

    struct Content {
        uint256 price;
        string uri;
        bool exists;
    }

    uint256 public contentCount;
    mapping(uint256 => Content) public contents;
    mapping(uint256 => mapping(address => bool)) public hasAccess;

    event ContentCreated(uint256 indexed contentId, uint256 price, string uri);
    event ContentPurchased(uint256 indexed contentId, address indexed buyer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    constructor(address _owner) {
        owner = _owner;
    }

    function createContent(uint256 price, string calldata uri) external onlyOwner {
        require(price > 0, "Price must be greater than zero");

        contents[contentCount] = Content({
            price: price,
            uri: uri,
            exists: true
        });

        emit ContentCreated(contentCount, price, uri);
        contentCount++;
    }

    function buyContent(uint256 contentId) external payable {
        Content memory content = contents[contentId];

        require(content.exists, "Content does not exist");
        require(msg.value == content.price, "Incorrect ETH amount");
        require(!hasAccess[contentId][msg.sender], "Already purchased");

        hasAccess[contentId][msg.sender] = true;

        emit ContentPurchased(contentId, msg.sender);
    }

    function getContentURI(uint256 contentId) external view returns (string memory) {
        require(hasAccess[contentId][msg.sender], "Access denied");
        return contents[contentId].uri;
    }

    function withdraw() external onlyOwner {
        (bool success,) = owner.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }

    receive() external payable {}
}

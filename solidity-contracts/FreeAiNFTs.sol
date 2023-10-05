// SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/metatx/ERC2771Context.sol";
import "@openzeppelin/contracts/metatx/MinimalForwarder.sol";

contract FreeAiNFTs is ERC2771Context, ERC721, ERC721Enumerable, ERC721URIStorage {
    struct SubscriberInfo {
        address _address;
        string preference;
        uint timestamp;
    }

    struct BatchInfo {
        string[] uris;
        uint firstTokenId;
        uint lastTokenId;
        uint subscribers;
        uint timestamp;
    }

    uint private _tokenIds;
    address private relayer;
    address private trustedForwarder;
    address private contractOwner;
    uint private maxSubscribers;

    uint private batchesCount = 0;
    mapping(uint => BatchInfo) private batchesInfo;

    SubscriberInfo[] private subscribers;

    event RelayerSet(address indexed oldRelayer, address indexed newRelayer);
    event NewSubscriber(address indexed _address, string preference);
    event NewBatch(uint indexed batchNr);

    constructor(
        address _relayer, 
        uint _maxSubscribers,
        MinimalForwarder _trustedForwarder
    ) ERC721("AI NFT Subscription", "AI NFT") ERC2771Context(address(_trustedForwarder)) {
        contractOwner = msg.sender;
        relayer = _relayer;
        trustedForwarder = address(_trustedForwarder);
        maxSubscribers = _maxSubscribers;
        emit RelayerSet(address(0), relayer);
    }

    function getBatchesCount() public view returns (uint) {
        return batchesCount;
    }

    function getBatchInfo(uint _id) public view returns (BatchInfo memory) {
        assert(_id < batchesCount);
        return batchesInfo[_id];
    }

    function getMaxSubscribers() public view returns (uint) {
        return maxSubscribers;
    }

    function getSubscribersCount() public view returns (uint) {
        return subscribers.length;
    }

    function getSubscriberInfo(uint _id) public view returns (SubscriberInfo memory) {
        assert(_id < subscribers.length);
        return subscribers[_id];
    }

    function getRelayer() public view returns (address) {
        return relayer;
    }

    function isSubscribed(address _address) public view returns (bool) {
        for (uint i = 0; i < subscribers.length; i++) {
            if (_address == subscribers[i]._address) {
                return true;
            }
        }
        return false;
    }


    function subscribeUser(address subscriber, string memory _preference) external _onlyTrustedForwarder {
        require(!isSubscribed(subscriber), "Already subscribed !");
        require(subscribers.length < maxSubscribers, "Max subscribers !");
        subscribers.push(SubscriberInfo(subscriber, _preference, block.timestamp));
        emit NewSubscriber(subscriber, _preference);
    }

    function mintAndSendNft(string[] memory _uris) public _onlyRelayer {
        assert(subscribers.length > 0);
        uint fromTokenId = _tokenIds + 1;
        for (uint i = 0; i < subscribers.length; i++) {
            address subscriberAddress = subscribers[i]._address;

            _tokenIds += 1;
            uint256 newItemId = _tokenIds;
            _mint(subscriberAddress, newItemId);
            _setTokenURI(newItemId, _uris[i]);
        }
        emit NewBatch(batchesCount);
        batchesInfo[batchesCount] = BatchInfo(_uris, fromTokenId, _tokenIds, subscribers.length, block.timestamp);
        batchesCount += 1;
    }

    function changeRelayer(address _relayer) public onlyContractOwner {
        relayer = _relayer;
        emit RelayerSet(relayer, _relayer);
    }

    modifier onlyContractOwner() {
        require(msg.sender == contractOwner, "Caller is not owner");
        _;
    }

    modifier _onlyRelayer() {
        require(msg.sender == relayer, "Caller is not relayer");
        _;
    }

    modifier _onlyTrustedForwarder() {
        require(msg.sender == trustedForwarder, "Caller is not trusted forwarder");
        _;
    }


    
    // Override functions

    function _msgSender() internal view override(Context, ERC2771Context)
        returns (address sender) {
        sender = ERC2771Context._msgSender();
    }

    function _msgData() internal view override(Context, ERC2771Context)
        returns (bytes calldata) {
        return ERC2771Context._msgData();
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 
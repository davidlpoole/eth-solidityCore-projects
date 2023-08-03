// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract MultiSig {
    address[] public owners;
    uint public transactionCount;
    uint public required;

    struct Transaction {
        address destination;
        uint value;
        bool executed;
    }

    mapping(uint => Transaction) public transactions;
    mapping(uint => mapping(address => bool)) public confirmations;

    constructor(address[] memory _owners, uint _confirmations) {
        require(_owners.length > 0, "owners must be > 0");
        require(_confirmations > 0, "confirmations must be > 0");
        require(_confirmations <= _owners.length, "confirmations must be <= number of owners");
        owners = _owners;
        required = _confirmations;
    }

    function isOwner(address _address) public view returns (bool) {
        for (uint256 i; i < owners.length; i++) {
            if (owners[i] == _address) {
                return true;
            }
        }
        return false;
    }

    modifier onlyOwner() {
        require(isOwner(msg.sender), "not an owner");
        _;
    }

    function getConfirmationsCount(uint transactionId) public view returns(uint) {
        uint count;
        for(uint i = 0; i < owners.length; i++) {
            if(confirmations[transactionId][owners[i]]) {
                count++;
            }
        }
        return count;
    }

    function confirmTransaction(uint transactionId) public onlyOwner {
        confirmations[transactionId][msg.sender] = true;
    }

    function addTransaction(address destination, uint value) internal onlyOwner returns(uint) {
        transactions[transactionCount] = Transaction(destination, value, false);
        transactionCount += 1;
        return transactionCount - 1;
    }

    function submitTransaction(address dest, uint value) external {
        uint id = addTransaction(dest, value);
        confirmTransaction(id);
    }
}

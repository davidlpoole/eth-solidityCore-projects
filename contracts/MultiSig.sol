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

    function addTransaction(address destination, uint value) public returns(uint transactionId) {
        transactionId = transactionCount;
        transactions[transactionCount] = Transaction(destination, value, false);
        transactionCount += 1;
    }

    constructor(address[] memory _owners, uint _confirmations) {
        require(_owners.length > 0, "owners must be > 0");
        require(_confirmations > 0, "confirmations must be > 0");
        require(_confirmations <= _owners.length, "confirmations must be <= number of owners");
        owners = _owners;
        required = _confirmations;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

contract Switch {
    address public recipient;
    address public owner;
    uint private start;

    constructor(address _recipient) payable {
        owner = msg.sender;
        recipient = _recipient;
        start = block.timestamp;
    }

    function withdraw() external {
        require(block.timestamp >= start + 52 weeks, "too early");
        require(msg.sender == recipient, "only recipient authorised");
        (bool s, ) = recipient.call{value:address(this).balance}("");
        require(s);
    }

    function ping() external {
        require(msg.sender == owner, "only owner authorised");
        start = block.timestamp;
    }
}
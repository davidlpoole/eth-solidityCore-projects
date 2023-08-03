// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Party {
    uint public required_deposit;
    address[] public attendees;

    constructor(uint _required_deposit) {
        required_deposit = _required_deposit;
    }

    // Check whether an address is already on the list
    function has_rsvp(address person) public view returns (bool) {
        for (uint i; i < attendees.length; i++) {
            if (person == attendees[i]) return true;
        }
        return false;
    }

    // add sender to the list
    function rsvp() external payable {
        require(msg.value == required_deposit, "exact deposit amount required");
        require(!has_rsvp(msg.sender), "already on the list");
        attendees.push(msg.sender);
    }

    // pay the bill and split any remaining balance to attendees
    function payBill(address venue, uint bill) public {
        require(address(this).balance >= bill, "not enough funds");

        // pay the venue
        (bool s,) = venue.call{value: bill}("");
        require(s, "unable to pay the venue");

        // split the remainder between the attendees
        uint split = address(this).balance / attendees.length;
        for (uint i; i < attendees.length; i++) {
            (bool j,) = attendees[i].call{value: split}("");
            require(j, "unable to pay attendee");
        }
    }
}
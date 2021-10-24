// SPDX-License-Identifier: MIT

pragma solidity ^0.8.9;

contract Verto {
    // create id, address, and balance mappings
    mapping (string => address) private idToAddress;
    mapping (address => string) private addressToId;
    mapping (address => uint) private addressToValue;

    // accept any external payment and fund the associated account
    function addFunds() external payable {
        uint current = addressToValue[msg.sender];
        require(current != 0, "invalid account!");
        addressToValue[msg.sender] = current + msg.value;
    }

    // deduct funds when stripe transaction occurs
    function spendFunds(string memory id, uint amount, address caller) external {
        require(caller == msg.sender, "invalid caller!");
        address add = idToAddress[id];
        uint current = addressToValue[add];
        addressToValue[add] = current - amount;
    }

    // retreive funds from account (can be called by any user)
    function withdrawFunds(uint amount) external {
        uint current = addressToValue[msg.sender];
        require(current != 0, "invalid account!");
        uint deficit = amount;
        if (amount > current) {
            deficit = current;
        }
        addressToValue[msg.sender] = current - deficit;
        payable(msg.sender).transfer(deficit);
    }

    // check current ethereum balance using stripe id
    function checkBalance(string memory id) external view returns(uint) {
        address add = idToAddress[id];
        require(add != address(0), "invalid account!");
        return addressToValue[add];
    }

    // check current ethereum balance using address
    function checkBalanceAddress(address add) external view returns(uint) {
        return addressToValue[add];
    }

    // create a new user
    function createUser(string memory id, address add, address caller) external {
        require(caller == msg.sender, "invalid caller!");
        require(idToAddress[id] != add, "account already exists!");
        idToAddress[id] = add;
        addressToId[add] = id;
        addressToValue[add] = 1;
    }
}
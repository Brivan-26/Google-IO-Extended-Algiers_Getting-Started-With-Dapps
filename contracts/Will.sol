//SPDX-License-Identifier: No License
pragma solidity ^0.8.17;
contract Will {
    address public owner;
    uint fortune;
    address[] public inheritances;
    mapping(address => uint) amount;
    mapping(address => bool) isInheritor;
    uint lastPing;
    

    constructor() payable {
        owner = msg.sender;
        fortune = msg.value;
        lastPing = block.timestamp;
    }

    function addInherite(address _inherite, uint _amount) external onlyOwner {
        require(!isInheritor[_inherite], "Already inheritor");
        require(fortune  >=_amount, "Not sufficiant balance");
        inheritances.push(_inherite);
        isInheritor[_inherite] = true;
        amount[_inherite] = _amount;
        fortune -= _amount;
    }

    function getFortune() external view returns(uint){
        return fortune;
    }

    function increaseFortune(uint _fortune) external payable onlyOwner {
        fortune += _fortune;
    }

    function callForSplitFortune() external onlyInheritor {
        if((block.timestamp - lastPing) < 1 weeks) {
            revert("Didn't pass the inactivity lock");
        }
        splitFortune();
    }
    function splitFortune() private {
        for(uint i=0; i<inheritances.length; i++) {
            address inheritor = inheritances[i];
            (bool success, ) = payable(inheritor).call{value:amount[inheritor]}("");
            require(success, "Something went wrong");
        }
    }


    function ping() external onlyOwner {
        lastPing = block.timestamp;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner can call this function");
        lastPing = block.timestamp;
        _;
    }

    modifier onlyInheritor {
        require(isInheritor[msg.sender], "Only Inheritor can call this function");
        _;
    }
}
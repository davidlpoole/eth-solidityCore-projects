# Solidity Core Projects
## Party Split (`party.sol`)
Create a group with your friends to split a shared expense. 
Once the party's over, it's time to pay the shared expenses! 
Be sure to distribute the remainder to the members of the party.

## Dead Man's Switch (`switch.sol`)
Create a mechanism where the owner of a contract will need to ping or notify a contract every 52 weeks. 
If there is no activity during this time period, the recipient will be able to withdraw the funds. 
The assumption here is that the owner is no longer able to do so.





# Sample Hardhat Project

This project demonstrates a basic Hardhat use case. It comes with a sample contract, a test for that contract, and a script that deploys that contract.

Try running some of the following tasks:

```shell
npx hardhat help
npx hardhat test
REPORT_GAS=true npx hardhat test
npx hardhat node
npx hardhat run scripts/deploy_Lock.js
npx hardhat test --grep "party"
```

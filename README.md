# Solidity Core Projects

### Party Split (`/contracts/Party.sol`)
Create a group with your friends to split a shared expense. 
Once the party's over, it's time to pay the shared expenses! 
Be sure to distribute the remainder to the members of the party.

### Dead Man's Switch (`/contracts/Switch.sol`)
Create a mechanism where the owner of a contract will need to ping or notify a contract every 52 weeks. 
If there is no activity during this time period, the recipient will be able to withdraw the funds. 
The assumption here is that the owner is no longer able to do so.

### Hackathon (`/contracts/Hackathon.sol`)
Find the winning project of the hackathon. 
The winning project will be determined by the average score of all of its ratings.

### MultiSig (`/contracts/MultiSig.sol`)
Create a Multiple Signature Wallet that requires multiple confirmations (signatures) on a transaction before the transaction is executed.
When this wallet is deployed it will be configured with the owners addresses and how many signatures are required to move funds.

## Notes
```shell
npx hardhat test                    // all tests
npx hardhat test --grep "party"     // only tests with "party" in heading
```

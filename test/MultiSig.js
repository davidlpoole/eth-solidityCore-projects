const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect, assert} = require("chai");
const {readFileSync} = require("fs");

describe('MultiSig', () => {
    async function createContract() {
        const MultiSig = await ethers.getContractFactory("MultiSig");
        const accounts = await ethers.getSigners();

        return {MultiSig, accounts}
    }

    async function deployValid() {
        const _required = 2;
        const {MultiSig, accounts} = await loadFixture(createContract)
        const contract = await MultiSig.deploy(accounts.slice(0, 3), _required);
        await contract.waitForDeployment();
        return {contract, accounts, _required}
    }

    describe('ABI', () => {
        const jsonLoc = "./artifacts/contracts/MultiSig.sol/MultiSig.json";
        const {abi} = JSON.parse(readFileSync(jsonLoc).toString());

        it('should define the transaction count', async function () {
            const transactionCount = abi.filter(x => x.name === 'transactionCount')[0];
            assert(transactionCount);
            assert.deepEqual(transactionCount.outputs.map(x => x.type), ['uint256']);
        });

        it('should define a transactions mapping or array', async function () {
            const transactions = abi.filter(x => x.name === 'transactions')[0];
            assert(transactions);
            assert.deepEqual(transactions.inputs.map(x => x.type), ['uint256']);
            assert.deepEqual(transactions.outputs.map(x => x.type), ['address', 'uint256', 'bool']);
        });
    })


    describe('for a valid multisig', () => {

        it('should set an array of owners', async function () {
            const {contract, accounts} = await loadFixture(deployValid)
            let firstOwner = await contract.owners(0);
            let lastOwner = await contract.owners(2);
            assert.equal(accounts[2].address, lastOwner);
            assert.equal(accounts[0].address, firstOwner);
        });

        it('should set the number of required confirmations', async function () {
            const {contract, _required} = await loadFixture(deployValid)
            const required = await contract.required();
            assert.equal(_required, required);
        });
    });

    describe('for a multisig with no owners', () => {
        it('should revert', async () => {
            const {MultiSig} = await loadFixture(createContract)
            const _required = 1;
            await expect(MultiSig.deploy([], _required)).to.be.revertedWith("owners must be > 0");
        });
    });

    describe('for a multisig with no required confirmations', () => {
        it('should revert', async () => {
            const {MultiSig, accounts} = await loadFixture(createContract)
            const _required = 0;
            await expect(MultiSig.deploy(accounts.slice(0, 3), _required)).to.be.revertedWith("confirmations must be > 0");
        });
    });

    describe('for a multisig with more required confirmations than owners', () => {
        it('should revert', async () => {
            const {MultiSig, accounts} = await loadFixture(createContract)
            const _required = 4;
            await expect(MultiSig.deploy(accounts.slice(0, 3), _required)).to.be.revertedWith("confirmations must be <= number of owners");
        });
    });

    describe('AddTransactions', function () {

        it('should create a new Transaction', async function () {
            const {contract, accounts} = await loadFixture(deployValid)
            await contract.addTransaction(accounts[1], 100);
            let tx = await contract.transactions.staticCall(0);
            assert.equal(tx.length, 3);
            let address = tx[0];
            assert.notEqual(address, ethers.ZeroAddress);
        });

        it('should keep count of the amount of transactions', async function () {
            const {contract, accounts} = await loadFixture(deployValid)
            await contract.addTransaction(accounts[1], 100);
            let txCount = await contract.transactionCount.staticCall();
            assert.equal(txCount, 1);
        });

        it('should return a transaction id', async function () {
            const {contract, accounts} = await loadFixture(deployValid)
            await contract.addTransaction(accounts[1], 100);
            let txId = await contract.addTransaction.staticCall(accounts[1], 100);
            assert.equal(txId, 1);
        });
    });

});

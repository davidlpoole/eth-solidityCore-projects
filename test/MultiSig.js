const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

const {expect, assert} = require("chai");
const {readFileSync} = require("fs");


describe('MultiSig', () => {

    const oneEther = ethers.parseEther("1");
    const halfEther = ethers.parseEther("0.5");

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

    async function deployValidWithOneTx() {
        const {contract, accounts} = await loadFixture(deployValid)
        await contract.submitTransaction(accounts[3], halfEther);
        return ({contract, accounts})
    }

    async function deployValidWithTwoTxs() {
        const {contract, accounts} = await loadFixture(deployValidWithOneTx)
        await contract.submitTransaction(accounts[4], halfEther);
        return ({contract, accounts})
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

        it('should define a confirmations mapping', async function () {
            const confirmations = abi.filter(x => x.name === 'confirmations')[0];
            assert(confirmations);
            assert.deepEqual(confirmations.inputs.map(x => x.type), ['uint256', 'address']);
            assert.deepEqual(confirmations.outputs.map(x => x.type), ['bool']);
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

        it('should not call addTransaction externally', async function () {
            const {contract, accounts} = await loadFixture(deployValid);

            try {
                await contract.addTransaction(accounts[1], 100);
                expect.fail();
            } catch (error) {
                expect(error.message).to.include("no matching function");
            }
        });
    });


    describe('confirmTransaction', function () {

        describe('after creating the first transaction', function () {
            it('should confirm the transaction', async function () {
                const {contract} = await loadFixture(deployValidWithOneTx)
                let confirmed = await contract.getConfirmationsCount.staticCall(0);
                assert.equal(confirmed, 1);
            });
        });

        describe('after creating the second transaction', function () {
            it('should confirm the transaction twice', async function () {
                const {contract, accounts} = await loadFixture(deployValidWithTwoTxs)
                await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
                await contract.connect(accounts[1]).confirmTransaction(1);
                let confirmed = await contract.getConfirmationsCount.staticCall(1);
                assert.equal(confirmed, 2);
            });
        });

        describe('from an invalid address', () => {
            it('should revert', async function () {
                const {contract, accounts} = await loadFixture(deployValidWithOneTx)
                await expect(contract.connect(accounts[3]).confirmTransaction(0)).to.be.revertedWith("not an owner");
            });
        });

        describe('from a valid owner address', () => {
            it('should not revert', async function () {
                const {contract, accounts} = await loadFixture(deployValidWithOneTx)
                await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
                const confirmedBefore = await contract.getConfirmationsCount(0);
                assert.equal(confirmedBefore, 1);

                await contract.connect(accounts[1]).confirmTransaction(0);
                const confirmedAfter = await contract.getConfirmationsCount(0);
                assert.equal(confirmedAfter, 2);
            });
        });
    })


    describe('Submit Transaction', function () {
        it('should add a transaction', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await contract.submitTransaction(accounts[1], 100);
            let tx = await contract.transactions.staticCall(0);
            let address = tx[0];
            assert.notEqual(address, ethers.ZeroAddress);
        });

        it('should confirm a transaction', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await contract.submitTransaction(accounts[1], 100);

            let confirmed = await contract.getConfirmationsCount.staticCall(0);
            assert.equal(confirmed, 1);
        });

        it('should keep count of the amount of transactions', async function () {
            const {contract, accounts} = await loadFixture(deployValid)
            await contract.submitTransaction(accounts[1], 100);
            let txCount = await contract.transactionCount.staticCall();
            assert.equal(txCount, 1);
        });

        describe('from an invalid address', () => {
            it('should revert', async function () {
                const {contract, accounts} = await loadFixture(deployValidWithOneTx)
                await expect(contract.connect(accounts[3]).submitTransaction(accounts[1], 100)).to.be.revertedWith("not an owner");
            });
        });
    });


    describe('Fallback Tests', function () {
        it('should accept funds', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await expect(
                accounts[1].sendTransaction({ to: contract.target, value: oneEther })
            ).to.changeEtherBalance(contract.target, oneEther);

        });
    });


    describe('Confirmed Tests', function () {
        it('should return true if the required threshold is met for a transaction', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
            await contract.submitTransaction(accounts[1], 100);
            await contract.connect(accounts[1]).confirmTransaction(0);
            const confirmed = await contract.isConfirmed.staticCall(0);
            assert.equal(confirmed, true);
        });

        it('should return false if the required threshold is not met for a transaction', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await contract.submitTransaction(accounts[1], 100);
            let confirmed = await contract.isConfirmed.staticCall(0);
            assert.equal(confirmed, false);
        });
    });


    describe('Execute Transaction Tests', function () {

        it('should revert if not enough funds', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await contract.submitTransaction(accounts[4], halfEther);
            await expect(contract.connect(accounts[1]).confirmTransaction(0)).to.be.revertedWith("not enough funds");
        });

        it('should execute a transaction if confirmation threshold is met', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
            await contract.submitTransaction(accounts[4], halfEther);
            await contract.connect(accounts[1]).confirmTransaction(0);
            await expect(
                contract.connect(accounts[1]).executeTransaction(0)
            ).to.changeEtherBalance(accounts[4], halfEther);
            let txn = await contract.transactions.staticCall(0);
            assert.equal(txn[2], true, "Expected `executed` bool to be true!");
        });

        it('should not execute a transaction if confirmation threshold is not met', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
            await contract.submitTransaction(accounts[4], halfEther);
            await expect(contract.connect(accounts[1]).executeTransaction(0)).to.be.revertedWith("not enough confirmations");
        });

        it('should only allow valid owners to execute', async function () {
            const {contract, accounts} = await loadFixture(deployValid);
            await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
            await contract.submitTransaction(accounts[4], halfEther);
            await contract.connect(accounts[1]).confirmTransaction(0);
            await expect(contract.connect(accounts[4]).executeTransaction(0)).to.be.revertedWith("not an owner");
        });
    });


    describe("after depositing and submitting a transaction", () => {

        it('should not execute transaction yet', async () => {
            const {contract} = await loadFixture(deployValidWithOneTx);
            const txn = await contract.transactions.staticCall(0);
            assert(!txn.executed);
        });

        it('should not update the beneficiary balance', async () => {
            const {contract, accounts} = await loadFixture(deployValid);
            await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
            await expect(
                contract.submitTransaction(accounts[3], halfEther)
            ).to.not.changeEtherBalance(accounts[3], halfEther);
        });

        describe('after confirming', () => {

            it('should try to execute transaction after confirming', async () => {
                const {contract, accounts} = await loadFixture(deployValidWithOneTx);
                await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
                await contract.connect(accounts[1]).confirmTransaction(0);
                const txn = await contract.transactions.staticCall(0);
                assert(txn.executed);
            });

            it('should update the beneficiary balance', async () => {
                const {contract, accounts} = await loadFixture(deployValidWithOneTx);
                await accounts[1].sendTransaction({ to: contract.target, value: oneEther });
                await expect(
                    contract.connect(accounts[1]).confirmTransaction(0)
                ).to.changeEtherBalance(accounts[3], halfEther);

            });
        });
    });


});

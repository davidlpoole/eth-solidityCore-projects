const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect, assert} = require("chai");

describe('Party', () => {

    async function deployParty() {
        const deposit = ethers.parseEther("2");

        // Contracts are deployed using the first signer/account by default
        const signers = await ethers.getSigners();
        const owner = signers[0];
        const friends = signers.slice(1, 5);
        const venue = signers[6]

        const Party = await ethers.getContractFactory("Party");
        const contract = await Party.deploy(deposit, {value: 0});

        return {contract, owner, deposit, friends, venue};
    }

    async function initialRSVP() {

        const {contract, deposit, friends, venue} = await loadFixture(deployParty);

        const previousBalances = [];
        for (let i = 0; i < friends.length; i++) {
            await contract.connect(friends[i]).rsvp({
                value: ethers.parseEther("2"),
            });
            previousBalances[i] = await ethers.provider.getBalance(friends[i].address);
        }
        initialVenueBalance = await ethers.provider.getBalance(venue.address);

        return {contract, deposit, friends, venue, previousBalances, initialVenueBalance}
    }


    describe('RSVP', () => {
        it('should allow someone to RSVP who paid exactly the amount', async () => {
            const {contract, owner, deposit} = await loadFixture(deployParty);

            await contract.connect(owner).rsvp({value: deposit});
            const contractBalance = await ethers.provider.getBalance(contract.target);
            expect(contractBalance).to.equal(deposit);
        });

        it('should not allow someone to RSVP with less than the deposit', async () => {
            const {contract, owner} = await loadFixture(deployParty);
            await expect(contract.connect(owner).rsvp({value: ethers.parseEther("1")})).to.be.revertedWith("exact deposit amount required");
        });

        it('should not allow someone to RSVP with more than the deposit', async () => {
            const {contract, owner} = await loadFixture(deployParty);
            await expect(contract.connect(owner).rsvp({value: ethers.parseEther("3")})).to.be.revertedWith("exact deposit amount required");
        });

        it('should not allow someone to RSVP who paid the deposit twice', async () => {
            const {contract, owner, deposit} = await loadFixture(deployParty);
            await contract.connect(owner).rsvp({value: deposit});
            await expect(contract.connect(owner).rsvp({value: deposit})).to.be.revertedWith("already on the list");
        });
    });

    describe('for an eight ether bill', async () => {
        const bill = ethers.parseEther("8");

        it('should pay the bill', async () => {
            const {contract, venue, initialVenueBalance} = await loadFixture(initialRSVP);
            await contract.payBill(venue.address, bill);

            const balance = await ethers.provider.getBalance(venue.address);
            expect(balance).to.equal(initialVenueBalance + bill);
        });

        it('should refund nothing', async () => {
            for (let i = 0; i < 4; i++) {
                const {contract, venue, friends, previousBalances} = await loadFixture(initialRSVP);
                await contract.payBill(venue.address, bill);
                const balance = await ethers.provider.getBalance(friends[i].address);
                assert.equal(balance.toString(), previousBalances[i].toString());
            }
        });

    });


    describe('for a four ether bill', async () => {
        const bill = ethers.parseEther("4");

        it('should pay the bill', async () => {
            const {contract, venue, initialVenueBalance} = await loadFixture(initialRSVP);
            await contract.payBill(venue.address, bill);
            const balance = await ethers.provider.getBalance(venue.address);
            expect(balance).to.equal(initialVenueBalance + bill);
        });

        it('should only have cost one ether each', async () => {
            const {contract, venue, friends, previousBalances} = await loadFixture(initialRSVP);
            await contract.payBill(venue.address, bill);

            for (let i = 0; i < 4; i++) {
                const balance = await ethers.provider.getBalance(friends[i].address);
                const expected = previousBalances[i] + ethers.parseEther("1");
                assert.equal(balance, expected);
            }
        });
    });

    describe('for a two ether bill', async () => {
        const bill = ethers.parseEther("2");

        it('should pay the bill', async () => {
            const {contract, venue, initialVenueBalance} = await loadFixture(initialRSVP);
            await contract.payBill(venue.address, bill);
            const balance = await ethers.provider.getBalance(venue.address);
            expect(balance).to.equal(initialVenueBalance + bill);
        });

        it('should only have cost 0.5 ether each', async () => {
            const {contract, venue, friends, previousBalances} = await loadFixture(initialRSVP);
            await contract.payBill(venue.address, bill);

            for (let i = 0; i < 4; i++) {
                const balance = await ethers.provider.getBalance(friends[i].address);
                const expected = previousBalances[i] + ethers.parseEther("1.5");
                assert.equal(balance, expected);
            }
        });
    });


});
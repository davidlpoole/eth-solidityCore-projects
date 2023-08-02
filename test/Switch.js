const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai");
const passTime = (time) => ethers.provider.send('evm_increaseTime', [time]);

const oneWeek = 60 * 60 * 24 * 7;
const gasPrice = ethers.parseUnits("1", "gwei");
const oneEther = ethers.parseEther("1");
describe('Switch', () => {

    async function deploySwitch() {
        let contract;
        let owner, recipient, other;
        let recipientAddr;

        owner = await ethers.provider.getSigner(0);
        recipient = await ethers.provider.getSigner(1);
        recipientAddr = recipient.address;
        other = await ethers.provider.getSigner(2);

        const Switch = await ethers.getContractFactory("Switch");
        contract = await Switch.deploy(recipientAddr, {value: oneEther});
        await contract.waitForDeployment();

        return {contract, owner, recipient, other}
    }

    describe('Ping', () => {
        it('should allow the owner to ping', async () => {
            const {contract, owner} = await loadFixture(deploySwitch);
            await expect(contract.connect(owner).ping());
        })

        it('should not allow the recipient to ping', async () => {
            const {contract, recipient} = await loadFixture(deploySwitch);
            await expect(contract.connect(recipient).ping()).to.be.revertedWith("only owner authorised");
        })

        it('should not allow some other account to ping', async () => {
            const {contract, other} = await loadFixture(deploySwitch);
            await expect(contract.connect(other).ping()).to.be.revertedWith("only owner authorised");
        });
    })

    describe('Withdraw', () => {
        it('should allow (only) the recipient to withdraw', async () => {
            const {contract, owner, other, recipient} = await loadFixture(deploySwitch);
            await passTime(oneWeek * 70);
            await expect(contract.connect(owner).withdraw({gasPrice})).to.be.revertedWith("only recipient authorised");
            await expect(contract.connect(other).withdraw({gasPrice})).to.be.revertedWith("only recipient authorised");
            await expect(contract.connect(recipient).withdraw({gasPrice})).to.changeEtherBalance(recipient, oneEther);
        });

        it('should allow withdraw 52 weeks after deployment', async () => {
            let {contract, recipient} = await loadFixture(deploySwitch);
            await passTime(oneWeek * 40);
            await expect(contract.connect(recipient).withdraw({gasPrice})).to.be.revertedWith("too early")
            await passTime(oneWeek * 40);
            await expect(contract.connect(recipient).withdraw({gasPrice}));
        });

        it('should delay the wait time when pinged', async () => {
            let {contract, owner, recipient} = await loadFixture(deploySwitch);
            await passTime(oneWeek * 80);
            await contract.connect(owner).ping();
            await expect(contract.connect(recipient).withdraw({gasPrice})).to.be.revertedWith("too early")
            await passTime(oneWeek * 40);
            await expect(contract.connect(recipient).withdraw({gasPrice})).to.be.revertedWith("too early");
            await passTime(oneWeek * 40);
            await expect(contract.connect(recipient).withdraw({gasPrice}));
        });
    });

});

const {loadFixture} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const {expect} = require("chai");

describe('Hackathon', () => {

    async function deployHackathon() {
        const Hackathon = await ethers.getContractFactory("Hackathon");
        const contract = await Hackathon.deploy();
        await contract.waitForDeployment();

        return {contract}
    }

    describe('with a single project', () => {

        it('should award the sole participant', async () => {
            const {contract} = await loadFixture(deployHackathon);
            const projectName = 'Only';
            await contract.newProject(projectName);
            await contract.rate(0, 4);

            const winner = await contract.findWinner.call();
            expect(winner.title).to.equal(projectName);
        });
    })

    describe('with multiple projects', () => {

        describe('and a single judge', () => {

            it('should award the highest rated', async () => {
                const {contract} = await loadFixture(deployHackathon);

                const participant1 = 'First';
                const expectedWinner = 'Winning';
                const participant2 = 'Second';

                await contract.newProject(participant1);
                await contract.newProject(expectedWinner);
                await contract.newProject(participant2);

                await contract.rate(0, 4);
                await contract.rate(1, 5);
                await contract.rate(2, 2);

                const actualWinner = await contract.findWinner.call();
                expect(actualWinner.title).to.equal(expectedWinner);
            })
        })

        describe('and multiple judges', () => {

            it('should award the highest rated', async () => {
                const {contract} = await loadFixture(deployHackathon);
                const expectedWinner = 'Winning';
                const participant1 = 'First';
                const participant2 = 'Second';

                const projects = [
                    [participant1, [2, 2, 2, 2, 2, 2]],
                    [participant2, [0, 4]],
                    [expectedWinner, [2, 3, 4]],
                ]
                await Promise.all(projects.map(async ([title, ratings], idx) => {
                    await contract.newProject(title);
                    await Promise.all(ratings.map(async (r) => await contract.rate(idx, r)));
                }));

                const actualWinner = await contract.findWinner.call();
                expect(actualWinner.title).to.equal(expectedWinner);
            })
        })

    })

});

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Hackathon {
    struct Project {
        string title;
        uint[] ratings;
    }

    Project[] projects;

    function findWinner() external view returns (Project memory) {
        uint max;
        uint winner;
        for (uint i; i < projects.length; i++) {
            Project memory project = projects[i];
            uint sum;
            for (uint j; j < project.ratings.length; j++) {
                sum += project.ratings[j];
            }
            uint avg = sum / project.ratings.length;
            if (avg > max) {
                max = avg;
                winner = i;
            }
        }
        return projects[winner];
    }

    function newProject(string calldata _title) external {
        // creates a new project with a title and an empty ratings array
        projects.push(Project(_title, new uint[](0)));
    }

    function rate(uint _idx, uint _rating) external {
        // rates a project by its index
        projects[_idx].ratings.push(_rating);
    }
}

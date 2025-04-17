import { expect } from "chai";
import { ethers } from "hardhat";
import { YourContract, YourContract__factory } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("YourContract", function () {
  let contract: YourContract;
  let owner: SignerWithAddress;
  let player1: SignerWithAddress;
  let player2: SignerWithAddress;
  const MIN_BET = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, player1, player2] = await ethers.getSigners();
    const factory = await ethers.getContractFactory("YourContract");
    contract = await factory.deploy();
  });

  describe("Game Creation", function () {
    it("Should create a new game with correct initial state", async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });

      const game = await contract.getGame(0);
      expect(game.player1).to.equal(player1.address);
      expect(game.player2).to.equal(ethers.ZeroAddress);
      expect(game.state).to.equal(0); // WAITING
      expect(game.player1Move).to.equal(0); // NONE
      expect(game.player2Move).to.equal(0); // NONE
      expect(game.result).to.equal(0); // NONE
      expect(game.betAmount).to.equal(MIN_BET);
    });

    it("Should revert if bet amount is too low", async function () {
      const lowBet = ethers.parseEther("0.0005");
      await expect(contract.connect(player1).createGame(lowBet, { value: lowBet })).to.be.revertedWith(
        "Bet amount too low",
      );
    });

    it("Should revert if value sent doesn't match bet amount", async function () {
      await expect(contract.connect(player1).createGame(MIN_BET, { value: MIN_BET * 2n })).to.be.revertedWith(
        "Incorrect bet amount",
      );
    });
  });

  describe("Game Joining", function () {
    beforeEach(async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
    });

    it("Should allow player2 to join the game", async function () {
      await contract.connect(player2).joinGame(0, { value: MIN_BET });

      const game = await contract.getGame(0);
      expect(game.player2).to.equal(player2.address);
      expect(game.state).to.equal(1); // PLAYING
    });

    it("Should revert if game is not in waiting state", async function () {
      await contract.connect(player2).joinGame(0, { value: MIN_BET });
      await expect(contract.connect(owner).joinGame(0, { value: MIN_BET })).to.be.revertedWith("Game not available");
    });

    it("Should revert if bet amount doesn't match", async function () {
      await expect(contract.connect(player2).joinGame(0, { value: MIN_BET * 2n })).to.be.revertedWith(
        "Incorrect bet amount",
      );
    });
  });

  describe("Making Moves", function () {
    beforeEach(async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
      await contract.connect(player2).joinGame(0, { value: MIN_BET });
    });

    it("Should allow players to make moves", async function () {
      await contract.connect(player1).makeMove(0, 1); // ROCK
      await contract.connect(player2).makeMove(0, 2); // PAPER

      const game = await contract.getGame(0);
      expect(game.player1Move).to.equal(1);
      expect(game.player2Move).to.equal(2);
    });

    it("Should revert if game is not in playing state", async function () {
      await contract.connect(player1).makeMove(0, 1);
      await contract.connect(player2).makeMove(0, 2);

      await expect(contract.connect(player1).makeMove(0, 1)).to.be.revertedWith("Game not in progress");
    });

    it("Should revert if player tries to move twice", async function () {
      await contract.connect(player1).makeMove(0, 1);
      await expect(contract.connect(player1).makeMove(0, 2)).to.be.revertedWith("Not your turn or already moved");
    });

    it("Should determine winner correctly", async function () {
      // Player 1: ROCK, Player 2: SCISSORS -> Player 1 wins
      await contract.connect(player1).makeMove(0, 1);
      await contract.connect(player2).makeMove(0, 3);

      const game = await contract.getGame(0);
      expect(game.state).to.equal(2); // COMPLETED
      expect(game.result).to.equal(1); // PLAYER1_WIN
    });

    it("Should handle draws correctly", async function () {
      // Both players play ROCK -> Draw
      await contract.connect(player1).makeMove(0, 1);
      await contract.connect(player2).makeMove(0, 1);

      const game = await contract.getGame(0);
      expect(game.state).to.equal(2); // COMPLETED
      expect(game.result).to.equal(3); // DRAW
    });
  });

  describe("Game Results", function () {
    beforeEach(async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
      await contract.connect(player2).joinGame(0, { value: MIN_BET });
    });

    it("Should determine all possible outcomes correctly", async function () {
      // Test all possible move combinations
      const testCases = [
        { p1: 1, p2: 1, result: 3 }, // ROCK vs ROCK -> DRAW
        { p1: 1, p2: 2, result: 2 }, // ROCK vs PAPER -> P2 WINS
        { p1: 1, p2: 3, result: 1 }, // ROCK vs SCISSORS -> P1 WINS
        { p1: 2, p2: 1, result: 1 }, // PAPER vs ROCK -> P1 WINS
        { p1: 2, p2: 2, result: 3 }, // PAPER vs PAPER -> DRAW
        { p1: 2, p2: 3, result: 2 }, // PAPER vs SCISSORS -> P2 WINS
        { p1: 3, p2: 1, result: 2 }, // SCISSORS vs ROCK -> P2 WINS
        { p1: 3, p2: 2, result: 1 }, // SCISSORS vs PAPER -> P1 WINS
        { p1: 3, p2: 3, result: 3 }, // SCISSORS vs SCISSORS -> DRAW
      ];

      for (const testCase of testCases) {
        await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
        await contract.connect(player2).joinGame((await contract.gameCount()) - 1n, { value: MIN_BET });

        await contract.connect(player1).makeMove((await contract.gameCount()) - 1n, testCase.p1);
        await contract.connect(player2).makeMove((await contract.gameCount()) - 1n, testCase.p2);

        const game = await contract.getGame((await contract.gameCount()) - 1n);
        expect(game.result).to.equal(testCase.result);
      }
    });
  });
});

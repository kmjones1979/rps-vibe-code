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
      expect(game.player1Commitment).to.equal(ethers.ZeroHash);
      expect(game.player2Commitment).to.equal(ethers.ZeroHash);
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
      expect(game.state).to.equal(1); // COMMITTED
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

  describe("Committing Moves", function () {
    beforeEach(async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
      await contract.connect(player2).joinGame(0, { value: MIN_BET });
    });

    it("Should allow players to commit moves", async function () {
      // Player 1 commits ROCK
      const salt1 = ethers.randomBytes(32);
      const commitment1 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [1, salt1, player1.address]),
      );
      await contract.connect(player1).commitMove(0, commitment1);

      // Player 2 commits PAPER
      const salt2 = ethers.randomBytes(32);
      const commitment2 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [2, salt2, player2.address]),
      );
      await contract.connect(player2).commitMove(0, commitment2);

      const game = await contract.getGame(0);
      expect(game.player1Commitment).to.equal(commitment1);
      expect(game.player2Commitment).to.equal(commitment2);
      expect(game.state).to.equal(2); // REVEALED
    });

    it("Should revert if game is not in committed state", async function () {
      // Create a new game and try to commit before player2 joins
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
      const gameId = (await contract.gameCount()) - 1n;

      // Verify game is in WAITING state
      const game = await contract.getGame(gameId);
      expect(game.state).to.equal(0); // WAITING

      const salt = ethers.randomBytes(32);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [1, salt, player1.address]),
      );

      // Try to commit in WAITING state - should revert
      await expect(contract.connect(player1).commitMove(gameId, commitment)).to.be.revertedWith(
        "Game not in commit phase",
      );
    });

    it("Should revert if player tries to commit twice", async function () {
      const salt = ethers.randomBytes(32);
      const commitment = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [1, salt, player1.address]),
      );
      await contract.connect(player1).commitMove(0, commitment);
      await expect(contract.connect(player1).commitMove(0, commitment)).to.be.revertedWith(
        "Not your turn or already committed",
      );
    });
  });

  describe("Revealing Moves", function () {
    beforeEach(async function () {
      await contract.connect(player1).createGame(MIN_BET, { value: MIN_BET });
      await contract.connect(player2).joinGame(0, { value: MIN_BET });
    });

    it("Should allow players to reveal moves", async function () {
      // Player 1 commits ROCK
      const salt1 = ethers.randomBytes(32);
      const commitment1 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [1, salt1, player1.address]),
      );
      await contract.connect(player1).commitMove(0, commitment1);

      // Player 2 commits PAPER
      const salt2 = ethers.randomBytes(32);
      const commitment2 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [2, salt2, player2.address]),
      );
      await contract.connect(player2).commitMove(0, commitment2);

      // Reveal moves
      await contract.connect(player1).revealMove(0, 1, salt1);
      await contract.connect(player2).revealMove(0, 2, salt2);

      const game = await contract.getGame(0);
      expect(game.player1Move).to.equal(1); // ROCK
      expect(game.player2Move).to.equal(2); // PAPER
      expect(game.state).to.equal(3); // COMPLETED
      expect(game.result).to.equal(2); // PLAYER2_WIN
    });

    it("Should revert if game is not in revealed state", async function () {
      const salt = ethers.randomBytes(32);
      await expect(contract.connect(player1).revealMove(0, 1, salt)).to.be.revertedWith("Game not in reveal phase");
    });

    it("Should revert if commitment is invalid", async function () {
      // Player 1 commits ROCK
      const salt1 = ethers.randomBytes(32);
      const commitment1 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [1, salt1, player1.address]),
      );
      await contract.connect(player1).commitMove(0, commitment1);

      // Player 2 commits PAPER
      const salt2 = ethers.randomBytes(32);
      const commitment2 = ethers.keccak256(
        ethers.solidityPacked(["uint8", "bytes32", "address"], [2, salt2, player2.address]),
      );
      await contract.connect(player2).commitMove(0, commitment2);

      // Try to reveal with wrong salt
      await expect(contract.connect(player1).revealMove(0, 1, ethers.randomBytes(32))).to.be.revertedWith(
        "Invalid commitment",
      );
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

        // Player 1 commits and reveals
        const salt1 = ethers.randomBytes(32);
        const commitment1 = ethers.keccak256(
          ethers.solidityPacked(["uint8", "bytes32", "address"], [testCase.p1, salt1, player1.address]),
        );
        await contract.connect(player1).commitMove((await contract.gameCount()) - 1n, commitment1);

        // Player 2 commits and reveals
        const salt2 = ethers.randomBytes(32);
        const commitment2 = ethers.keccak256(
          ethers.solidityPacked(["uint8", "bytes32", "address"], [testCase.p2, salt2, player2.address]),
        );
        await contract.connect(player2).commitMove((await contract.gameCount()) - 1n, commitment2);

        // Reveal moves
        await contract.connect(player1).revealMove((await contract.gameCount()) - 1n, testCase.p1, salt1);
        await contract.connect(player2).revealMove((await contract.gameCount()) - 1n, testCase.p2, salt2);

        const game = await contract.getGame((await contract.gameCount()) - 1n);
        expect(game.result).to.equal(testCase.result);
      }
    });
  });
});

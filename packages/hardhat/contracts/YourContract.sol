// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract YourContract {
    // Game states
    enum GameState {
        WAITING,    // 0 - Game created, waiting for player 2
        COMMITTED,  // 1 - Both players committed their moves
        REVEALED,   // 2 - Both players revealed their moves
        COMPLETED   // 3 - Game finished, winner determined
    }

    enum Move {
        NONE,       // 0 - No move made yet
        ROCK,       // 1 - Rock move
        PAPER,      // 2 - Paper move
        SCISSORS    // 3 - Scissors move
    }

    enum GameResult {
        NONE,           // 0 - No result yet
        PLAYER1_WIN,    // 1 - Player 1 won
        PLAYER2_WIN,    // 2 - Player 2 won
        DRAW            // 3 - Game was a draw
    }

    struct Game {
        address player1;
        address player2;
        GameState state;
        bytes32 player1Commitment;
        bytes32 player2Commitment;
        Move player1Move;
        Move player2Move;
        GameResult result;
        uint256 betAmount;
    }

    // State Variables
    mapping(uint256 => Game) public games;
    uint256 public gameCount;
    uint256 public constant MIN_BET = 0.001 ether;

    // Events
    event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount);
    event GameJoined(uint256 indexed gameId, address indexed player2);
    event MoveCommitted(uint256 indexed gameId, address indexed player);
    event MoveRevealed(uint256 indexed gameId, address indexed player, Move move);
    event GameCompleted(uint256 indexed gameId, address indexed winner, uint256 amount);

    // Modifiers
    modifier gameExists(uint256 gameId) {
        require(gameId < gameCount, "Game does not exist");
        _;
    }

    modifier onlyPlayers(uint256 gameId) {
        Game storage game = games[gameId];
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player");
        _;
    }

    modifier validMove(Move move) {
        require(move == Move.ROCK || move == Move.PAPER || move == Move.SCISSORS, "Invalid move");
        _;
    }

    /**
     * @dev Creates a new game with a bet amount
     * @param betAmount The amount of ETH to bet
     */
    function createGame(uint256 betAmount) external payable {
        require(msg.value >= MIN_BET, "Bet amount too low");
        require(msg.value == betAmount, "Incorrect bet amount");

        games[gameCount] = Game({
            player1: msg.sender,
            player2: address(0),
            state: GameState.WAITING,
            player1Commitment: bytes32(0),
            player2Commitment: bytes32(0),
            player1Move: Move.NONE,
            player2Move: Move.NONE,
            result: GameResult.NONE,
            betAmount: betAmount
        });

        emit GameCreated(gameCount, msg.sender, betAmount);
        gameCount++;
    }

    /**
     * @dev Joins an existing game
     * @param gameId The ID of the game to join
     */
    function joinGame(uint256 gameId) external payable {
        Game storage game = games[gameId];
        require(game.state == GameState.WAITING, "Game not available");
        require(msg.value == game.betAmount, "Incorrect bet amount");

        game.player2 = msg.sender;
        game.state = GameState.COMMITTED; // Game moves to COMMITTED state when player2 joins
        emit GameJoined(gameId, msg.sender);
    }

    /**
     * @dev Commits a move in the game
     * @param gameId The ID of the game
     * @param commitment The commitment to make
     */
    function commitMove(uint256 gameId, bytes32 commitment) external onlyPlayers(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.COMMITTED, "Game not in commit phase");
        
        if (msg.sender == game.player1 && game.player1Commitment == bytes32(0)) {
            game.player1Commitment = commitment;
        } else if (msg.sender == game.player2 && game.player2Commitment == bytes32(0)) {
            game.player2Commitment = commitment;
        } else {
            revert("Not your turn or already committed");
        }

        emit MoveCommitted(gameId, msg.sender);

        if (game.player1Commitment != bytes32(0) && game.player2Commitment != bytes32(0)) {
            game.state = GameState.REVEALED;
        }
    }

    /**
     * @dev Reveals a move in the game
     * @param gameId The ID of the game
     * @param move The move to reveal
     * @param salt The salt used for commitment
     */
    function revealMove(uint256 gameId, Move move, bytes32 salt) external onlyPlayers(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.REVEALED, "Game not in reveal phase");
        require(move != Move.NONE, "Invalid move");

        bytes32 commitment = keccak256(abi.encodePacked(move, salt, msg.sender));
        
        if (msg.sender == game.player1) {
            require(commitment == game.player1Commitment, "Invalid commitment");
            game.player1Move = move;
        } else {
            require(commitment == game.player2Commitment, "Invalid commitment");
            game.player2Move = move;
        }

        emit MoveRevealed(gameId, msg.sender, move);

        if (game.player1Move != Move.NONE && game.player2Move != Move.NONE) {
            _determineWinner(gameId);
        }
    }

    /**
     * @dev Internal function to determine the winner of the game
     * @param gameId The ID of the game
     */
    function _determineWinner(uint256 gameId) private {
        Game storage game = games[gameId];
        require(game.state == GameState.REVEALED, "Game not ready for result");
        require(game.player1Move != Move.NONE && game.player2Move != Move.NONE, "Moves not revealed");

        game.state = GameState.COMPLETED;

        if (game.player1Move == game.player2Move) {
            game.result = GameResult.DRAW;
            // Return bets to both players
            (bool success1, ) = game.player1.call{value: game.betAmount}("");
            (bool success2, ) = game.player2.call{value: game.betAmount}("");
            require(success1 && success2, "Transfer failed");
        } else if (
            (game.player1Move == Move.ROCK && game.player2Move == Move.SCISSORS) ||
            (game.player1Move == Move.PAPER && game.player2Move == Move.ROCK) ||
            (game.player1Move == Move.SCISSORS && game.player2Move == Move.PAPER)
        ) {
            game.result = GameResult.PLAYER1_WIN;
            // Send both bets to player 1
            (bool success, ) = game.player1.call{value: game.betAmount * 2}("");
            require(success, "Transfer failed");
        } else {
            game.result = GameResult.PLAYER2_WIN;
            // Send both bets to player 2
            (bool success, ) = game.player2.call{value: game.betAmount * 2}("");
            require(success, "Transfer failed");
        }

        emit GameCompleted(gameId, 
            game.result == GameResult.PLAYER1_WIN ? game.player1 : 
            game.result == GameResult.PLAYER2_WIN ? game.player2 : address(0),
            game.betAmount * 2
        );
    }

    /**
     * @dev Returns the current state of a game
     * @param gameId The ID of the game
     */
    function getGame(uint256 gameId) external view returns (
        address player1,
        address player2,
        GameState state,
        bytes32 player1Commitment,
        bytes32 player2Commitment,
        Move player1Move,
        Move player2Move,
        GameResult result,
        uint256 betAmount
    ) {
        Game storage game = games[gameId];
        return (
            game.player1,
            game.player2,
            game.state,
            game.player1Commitment,
            game.player2Commitment,
            game.player1Move,
            game.player2Move,
            game.result,
            game.betAmount
        );
    }
}

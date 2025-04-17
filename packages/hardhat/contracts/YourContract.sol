//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

contract YourContract {
    // Game states
    enum GameState { WAITING, PLAYING, COMPLETED }
    enum Move { NONE, ROCK, PAPER, SCISSORS }
    enum GameResult { NONE, PLAYER1_WIN, PLAYER2_WIN, DRAW }

    struct Game {
        address player1;
        address player2;
        GameState state;
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
    event MoveMade(uint256 indexed gameId, address indexed player, Move move);
    event GameCompleted(uint256 indexed gameId, GameResult result);

    // Modifiers
    modifier gameExists(uint256 gameId) {
        require(gameId < gameCount, "Game does not exist");
        _;
    }

    modifier isPlayer(uint256 gameId) {
        Game storage game = games[gameId];
        require(msg.sender == game.player1 || msg.sender == game.player2, "Not a player in this game");
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
    function createGame(uint256 betAmount) public payable {
        require(msg.value >= betAmount, "Insufficient bet amount");
        require(betAmount >= MIN_BET, "Bet amount too low");
        require(msg.value == betAmount, "Incorrect bet amount");

        uint256 gameId = gameCount++;
        games[gameId] = Game({
            player1: msg.sender,
            player2: address(0),
            state: GameState.WAITING,
            player1Move: Move.NONE,
            player2Move: Move.NONE,
            result: GameResult.NONE,
            betAmount: betAmount
        });

        emit GameCreated(gameId, msg.sender, betAmount);
    }

    /**
     * @dev Joins an existing game
     * @param gameId The ID of the game to join
     */
    function joinGame(uint256 gameId) public payable gameExists(gameId) {
        Game storage game = games[gameId];
        require(game.state == GameState.WAITING, "Game not available");
        require(game.player2 == address(0), "Game already has two players");
        require(msg.sender != game.player1, "Cannot play against yourself");
        require(msg.value == game.betAmount, "Incorrect bet amount");

        game.player2 = msg.sender;
        game.state = GameState.PLAYING;

        emit GameJoined(gameId, msg.sender);
    }

    /**
     * @dev Makes a move in the game
     * @param gameId The ID of the game
     * @param move The move to make (ROCK, PAPER, or SCISSORS)
     */
    function makeMove(uint256 gameId, Move move) public gameExists(gameId) isPlayer(gameId) validMove(move) {
        Game storage game = games[gameId];
        require(game.state == GameState.PLAYING, "Game not in progress");

        if (msg.sender == game.player1) {
            require(game.player1Move == Move.NONE, "Not your turn or already moved");
            game.player1Move = move;
        } else {
            require(game.player2Move == Move.NONE, "Not your turn or already moved");
            game.player2Move = move;
        }

        emit MoveMade(gameId, msg.sender, move);

        // If both players have made their moves, determine the winner
        if (game.player1Move != Move.NONE && game.player2Move != Move.NONE) {
            _determineWinner(gameId);
        }
    }

    /**
     * @dev Internal function to determine the winner of the game
     * @param gameId The ID of the game
     */
    function _determineWinner(uint256 gameId) internal {
        Game storage game = games[gameId];
        
        if (game.player1Move == game.player2Move) {
            game.result = GameResult.DRAW;
            // Return bets to both players
            (bool success1, ) = game.player1.call{value: game.betAmount}("");
            (bool success2, ) = game.player2.call{value: game.betAmount}("");
            require(success1 && success2, "Failed to return bets");
        } else if (
            (game.player1Move == Move.ROCK && game.player2Move == Move.SCISSORS) ||
            (game.player1Move == Move.PAPER && game.player2Move == Move.ROCK) ||
            (game.player1Move == Move.SCISSORS && game.player2Move == Move.PAPER)
        ) {
            game.result = GameResult.PLAYER1_WIN;
            // Send all bets to player1
            (bool success, ) = game.player1.call{value: game.betAmount * 2}("");
            require(success, "Failed to send winnings");
        } else {
            game.result = GameResult.PLAYER2_WIN;
            // Send all bets to player2
            (bool success, ) = game.player2.call{value: game.betAmount * 2}("");
            require(success, "Failed to send winnings");
        }

        game.state = GameState.COMPLETED;
        emit GameCompleted(gameId, game.result);
    }

    /**
     * @dev Returns the current state of a game
     * @param gameId The ID of the game
     */
    function getGame(uint256 gameId) public view gameExists(gameId) returns (
        address player1,
        address player2,
        GameState state,
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
            game.player1Move,
            game.player2Move,
            game.result,
            game.betAmount
        );
    }
}

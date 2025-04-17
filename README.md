# 🏗 Scaffold-ETH 2

<h4 align="center">
  <a href="https://docs.scaffoldeth.io">Documentation</a> |
  <a href="https://scaffoldeth.io">Website</a>
</h4>

🧪 An open-source, up-to-date toolkit for building decentralized applications (dapps) on the Ethereum blockchain. It's designed to make it easier for developers to create and deploy smart contracts and build user interfaces that interact with those contracts.

⚙️ Built using NextJS, RainbowKit, Hardhat, Wagmi, Viem, and Typescript.

-   ✅ **Contract Hot Reload**: Your frontend auto-adapts to your smart contract as you edit it.
-   🪝 **[Custom hooks](https://docs.scaffoldeth.io/hooks/)**: Collection of React hooks wrapper around [wagmi](https://wagmi.sh/) to simplify interactions with smart contracts with typescript autocompletion.
-   🧱 [**Components**](https://docs.scaffoldeth.io/components/): Collection of common web3 components to quickly build your frontend.
-   🔥 **Burner Wallet & Local Faucet**: Quickly test your application with a burner wallet and local faucet.
-   🔐 **Integration with Wallet Providers**: Connect to different wallet providers and interact with the Ethereum network.

![Debug Contracts tab](https://github.com/scaffold-eth/scaffold-eth-2/assets/55535804/b237af0c-5027-4849-a5c1-2e31495cccb1)

## Requirements

Before you begin, you need to install the following tools:

-   [Node (>= v20.18.3)](https://nodejs.org/en/download/)
-   Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
-   [Git](https://git-scm.com/downloads)

## Quickstart

To get started with Scaffold-ETH 2, follow the steps below:

1. Install dependencies if it was skipped in CLI:

```
cd my-dapp-example
yarn install
```

2. Run a local network in the first terminal:

```
yarn chain
```

This command starts a local Ethereum network using Hardhat. The network runs on your local machine and can be used for testing and development. You can customize the network configuration in `packages/hardhat/hardhat.config.ts`.

3. On a second terminal, deploy the test contract:

```
yarn deploy
```

This command deploys a test smart contract to the local network. The contract is located in `packages/hardhat/contracts` and can be modified to suit your needs. The `yarn deploy` command uses the deploy script located in `packages/hardhat/deploy` to deploy the contract to the network. You can also customize the deploy script.

4. On a third terminal, start your NextJS app:

```
yarn start
```

Visit your app on: `http://localhost:3000`. You can interact with your smart contract using the `Debug Contracts` page. You can tweak the app config in `packages/nextjs/scaffold.config.ts`.

Run smart contract test with `yarn hardhat:test`

-   Edit your smart contracts in `packages/hardhat/contracts`
-   Edit your frontend homepage at `packages/nextjs/app/page.tsx`. For guidance on [routing](https://nextjs.org/docs/app/building-your-application/routing/defining-routes) and configuring [pages/layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) checkout the Next.js documentation.
-   Edit your deployment scripts in `packages/hardhat/deploy`

## Documentation

Visit our [docs](https://docs.scaffoldeth.io) to learn how to start building with Scaffold-ETH 2.

To know more about its features, check out our [website](https://scaffoldeth.io).

## Contributing to Scaffold-ETH 2

We welcome contributions to Scaffold-ETH 2!

Please see [CONTRIBUTING.MD](https://github.com/scaffold-eth/scaffold-eth-2/blob/main/CONTRIBUTING.md) for more information and guidelines for contributing to Scaffold-ETH 2.

# 🎮 Rock Paper Scissors on Ethereum

A decentralized Rock Paper Scissors game built with Scaffold-ETH 2, featuring a secure commit-reveal pattern to prevent cheating. This project demonstrates how to build a fair and transparent dApp with smart contracts and a React frontend.

## 📚 Table of Contents

-   [Smart Contract Overview](#smart-contract-overview)
-   [Frontend Implementation](#frontend-implementation)
-   [Game Flow](#game-flow)
-   [Technical Details](#technical-details)
-   [Development Guide](#development-guide)

## Smart Contract Overview

The game is implemented in `YourContract.sol` using Solidity. Here's a breakdown of the key components:

### Enums and State Management

```solidity
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
```

### Game Struct

```solidity
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
```

### Key Functions

1. **Creating a Game**

```solidity
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
```

2. **Joining a Game**

```solidity
function joinGame(uint256 gameId) external payable {
    Game storage game = games[gameId];
    require(game.state == GameState.WAITING, "Game not available");
    require(msg.value == game.betAmount, "Incorrect bet amount");

    game.player2 = msg.sender;
    game.state = GameState.COMMITTED;
    emit GameJoined(gameId, msg.sender);
}
```

3. **Committing a Move**

```solidity
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
```

4. **Revealing a Move**

```solidity
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
```

## Frontend Implementation

The frontend is built with React and uses Scaffold-ETH 2's custom hooks for blockchain interaction.

### Secure Move Commitment System

The game uses a password-based commitment system to ensure move secrecy and prevent cheating:

1. **Committing a Move**

    - Players enter a password and select their move (Rock, Paper, or Scissors)
    - The salt is generated from: `keccak256(password + gameId + playerAddress)`
    - The commitment is created using: `keccak256(move + salt + playerAddress)`
    - Only the move is stored locally; the password is never saved
    - The commitment is sent to the blockchain

2. **Revealing a Move**
    - Players must re-enter their password to reveal their move
    - The system regenerates the salt and commitment to verify the password
    - If the regenerated commitment matches the one on-chain, the move is revealed
    - This ensures players can't change their move after committing

### Security Considerations

-   Passwords are never stored in localStorage or anywhere else
-   Each commitment is unique to the game and player (using gameId and address)
-   Password verification happens client-side before sending transactions
-   Players must remember their password to reveal their move
-   The system prevents move changes after commitment

### Game Interface

```typescript
interface Game {
    id: bigint;
    player1: `0x${string}`;
    player2: `0x${string}`;
    state: number;
    player1Commitment: string;
    player2Commitment: string;
    player1Move: number;
    player2Move: number;
    result: number;
    betAmount: bigint;
}
```

### Betting System

-   All bets must be in ETH
-   Minimum bet amount: 0.001 ETH
-   Each player must stake the same amount
-   Winners receive both stakes (2x their bet)
-   In case of a draw, both players receive their stake back

### Game States

1. **WAITING (0)**

    - Game created by player 1
    - Waiting for player 2 to join with matching stake

2. **COMMITTED (1)**

    - Both players have joined
    - Players can commit their moves using passwords
    - Transitions to REVEALED when both commits are received

3. **REVEALED (2)**

    - Both players have committed their moves
    - Players must re-enter passwords to reveal moves
    - Transitions to COMPLETED when both moves are revealed

4. **COMPLETED (3)**
    - Both moves revealed
    - Winner determined
    - Stakes distributed
    - Game results permanently recorded on-chain

### Development Guide

Follow these steps to run the game locally:

1. Install dependencies:

```bash
yarn install
```

2. Start local blockchain:

```bash
yarn chain
```

3. Deploy the contract:

```bash
yarn deploy
```

4. Start the frontend:

```bash
yarn start
```

5. Visit `http://localhost:3000` to play!

### Testing

Run the test suite to verify game mechanics:

```bash
yarn hardhat:test
```

The tests cover:

-   Game creation and joining
-   Move commitment and revelation
-   Password-based commitment verification
-   Winner determination
-   Stake distribution
-   Error cases and security checks

## License

This project is licensed under the MIT License - see the LICENSE file for details.

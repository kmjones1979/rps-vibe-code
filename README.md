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

A decentralized Rock Paper Scissors game built with Scaffold-ETH 2. This project demonstrates how to build a simple but complete dApp with smart contracts and a React frontend.

## 🔒 Enhanced Security Version

This repository includes a special branch with enhanced security features using the commit-reveal pattern! 🛡️

### 🌟 Commit-Reveal Version

Check out the secure implementation in the [`commit-reveal-version`](https://github.com/kmjones1979/rps-vibe-code/tree/commit-reveal-version) branch, which includes:

-   🔒 Secure commit-reveal pattern to prevent move prediction
-   🧪 Comprehensive test suite for security features
-   📚 Detailed tutorial in `TUTORIAL.md`
-   🎮 Complete game flow with betting and security

### 📖 Learn More

For a detailed explanation of the commit-reveal pattern and its implementation, check out the [TUTORIAL.md](TUTORIAL.md) file in the repository.

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
    PLAYING,    // 1 - Both players joined, making moves
    COMPLETED   // 2 - Game finished, winner determined
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
    game.state = GameState.PLAYING;
    emit GameJoined(gameId, msg.sender);
}
```

3. **Making a Move**

```solidity
function makeMove(uint256 gameId, Move move) external {
    Game storage game = games[gameId];
    require(game.state == GameState.PLAYING, "Game not in progress");

    if (msg.sender == game.player1 && game.player1Move == Move.NONE) {
        game.player1Move = move;
    } else if (msg.sender == game.player2 && game.player2Move == Move.NONE) {
        game.player2Move = move;
    } else {
        revert("Not your turn or already moved");
    }

    emit MoveMade(gameId, msg.sender, move);

    if (game.player1Move != Move.NONE && game.player2Move != Move.NONE) {
        _determineWinner(gameId);
    }
}
```

## Frontend Implementation

The frontend is built with React and uses Scaffold-ETH 2's custom hooks for blockchain interaction.

### Key Components

1. **Game Interface**

```typescript
interface Game {
    id: bigint;
    player1: `0x${string}`;
    player2: `0x${string}`;
    state: number;
    player1Move: number;
    player2Move: number;
    result: number;
    betAmount: bigint;
}
```

2. **Contract Interaction Hooks**

```typescript
// Reading game count
const { data: gameCount } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "gameCount",
    watch: true,
});

// Writing to contract
const { writeContractAsync: createGame } = useScaffoldWriteContract({
    contractName: "YourContract",
});
```

3. **Event Handling**

```typescript
useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "MoveMade",
    onLogs: (logs) => {
        logs.forEach((log) => {
            if (log.args?.gameId && log.args?.player && log.args?.move) {
                console.log(`🎯 Move made: ${Move[Number(log.args.move)]}`);
            }
        });
    },
});
```

### Game Flow Implementation

1. **Creating a Game**

```typescript
const handleCreateGame = async () => {
    try {
        await createGame({
            functionName: "createGame",
            args: [parseEther(betAmount)],
            value: parseEther(betAmount),
        });
    } catch (error) {
        console.error("Error creating game:", error);
    }
};
```

2. **Joining a Game**

```typescript
const handleJoinGame = async (gameId: bigint) => {
    try {
        await joinGame({
            functionName: "joinGame",
            args: [gameId],
            value: parseEther(betAmount),
        });
    } catch (error) {
        console.error("Error joining game:", error);
    }
};
```

3. **Making a Move**

```typescript
const handleMakeMove = async (gameId: bigint, move: Move) => {
    try {
        await makeMove({
            functionName: "makeMove",
            args: [gameId, move],
        });
    } catch (error) {
        console.error("Error making move:", error);
    }
};
```

## Game Flow

1. **Game Creation**

    - Player 1 creates a game with a bet amount
    - Contract emits `GameCreated` event
    - Game state is set to `WAITING`

2. **Game Joining**

    - Player 2 joins the game with matching bet
    - Contract emits `GameJoined` event
    - Game state changes to `PLAYING`

3. **Making Moves**

    - Players take turns making moves
    - Contract emits `MoveMade` events
    - When both moves are made, winner is determined

4. **Game Completion**
    - Contract determines winner
    - Emits `GameCompleted` event
    - Prize is distributed to winner

## Technical Details

### Smart Contract Security

-   Reentrancy protection
-   Input validation
-   State transition checks
-   Proper access control

### Frontend Optimizations

-   Debounced contract reads
-   Event-based updates
-   Efficient state management
-   Type safety with TypeScript

## Development Guide

### Prerequisites

-   Node.js >= v20.18.3
-   Yarn
-   Git

### Setup

1. Clone the repository
2. Install dependencies:

```bash
yarn install
```

3. Start local blockchain:

```bash
yarn chain
```

4. Deploy contracts:

```bash
yarn deploy
```

5. Start frontend:

```bash
yarn start
```

### Testing

```bash
yarn test
```

### Useful Resources

-   [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io)
-   [Solidity Documentation](https://docs.soliditylang.org)
-   [Wagmi Documentation](https://wagmi.sh)
-   [Next.js Documentation](https://nextjs.org/docs)

## Learning Exercise

This project is designed to be a learning resource. Here are some suggested exercises:

1. **Smart Contract**

    - Add a time limit for moves
    - Implement a tiebreaker system
    - Add support for multiple rounds
    - Create a tournament system

2. **Frontend**

    - Add animations for moves
    - Implement a chat system
    - Create a leaderboard
    - Add sound effects

3. **Testing**
    - Write unit tests for the contract
    - Add integration tests
    - Implement frontend testing
    - Create a test coverage report

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License.

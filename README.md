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

### Key Components

1. **Game Interface**

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
    eventName: "MoveRevealed",
    onLogs: (logs) => {
        logs.forEach((log) => {
            if (log.args?.gameId && log.args?.player && log.args?.move) {
                console.log(`🎯 Move revealed: ${Move[Number(log.args.move)]}`);
            }
        });
    },
});
```

## Game Flow

1. **Game Creation**

    - Player 1 creates a game with a bet amount
    - Game starts in WAITING state

2. **Game Joining**

    - Player 2 joins the game with matching bet amount
    - Game transitions to COMMITTED state

3. **Move Commitment**

    - Both players commit their moves using a hash of their move + salt
    - Game transitions to REVEALED state when both commitments are made

4. **Move Revelation**

    - Players reveal their moves by providing the original move and salt
    - Contract verifies the commitment matches
    - Game transitions to COMPLETED state when both moves are revealed

5. **Winner Determination**
    - Contract determines winner based on Rock Paper Scissors rules
    - Winner receives both bets
    - In case of a draw, bets are returned to both players

## Security Considerations

1. **Commit-Reveal Pattern**

    - Players commit to their moves before revealing them
    - Prevents players from changing their moves based on opponent's choice
    - Uses keccak256 hash function for commitment generation

2. **State Management**

    - Clear state transitions prevent invalid operations
    - Each state has specific allowed actions
    - Proper checks ensure game integrity

3. **Bet Handling**
    - Exact bet amount matching required
    - Secure transfer of funds to winner
    - Draw handling returns funds to both players

## Development Guide

1. **Setup**

    ```bash
    git clone https://github.com/your-repo/rock-paper-scissors.git
    cd rock-paper-scissors
    yarn install
    ```

2. **Local Development**

    ```bash
    yarn chain        # Start local blockchain
    yarn deploy       # Deploy contracts
    yarn start        # Start frontend
    ```

3. **Testing**

    ```bash
    yarn hardhat:test # Run contract tests
    ```

4. **Deployment**
    ```bash
    yarn deploy --network <network> # Deploy to specific network
    ```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

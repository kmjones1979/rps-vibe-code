# 🎮 Rock Paper Scissors: From Simple to Secure 🛡️

This tutorial will take you on a journey from a basic Rock Paper Scissors game to a secure blockchain implementation using the commit-reveal pattern. We'll explore both the theoretical concepts and practical implementation details, making sure you understand every step of the process! 🚀

## 🎯 Understanding the Commit-Reveal Pattern

The commit-reveal pattern is like a magical envelope system for blockchain games! ✉️ Here's how it works:

1. **Commit Phase** 🔒

    - Players generate a commitment (hash) of their move
    - The commitment includes:
        - The actual move (Rock, Paper, or Scissors) 🪨 📄 ✂️
        - A random salt (to prevent brute-forcing) 🧂
        - The player's address (to prevent replay attacks) 👤
    - Players submit only the hash to the blockchain
    - No one can determine the actual move from the hash 🕵️‍♂️

2. **Reveal Phase** 🔓
    - After both players have committed
    - Players reveal their moves by providing:
        - The actual move
        - The salt used in the commitment
    - The contract verifies the commitment matches
    - The game proceeds with the verified moves 🎲

### 🤔 Why Use Commit-Reveal?

-   **Prevents Move Prediction** 🎯: Players can't see each other's moves before committing
-   **Ensures Move Integrity** 🔒: Players can't change their moves after seeing the opponent's commitment
-   **Prevents Replay Attacks** 🛡️: Including the player's address in the hash prevents move reuse
-   **Adds Randomness** 🎲: The salt ensures each commitment is unique

## 🔐 Understanding the Hashing Mechanism

The commit-reveal pattern relies heavily on cryptographic hashing to ensure security. Let's break down how the hashing works in detail, starting from fundamental concepts and building up to the complete implementation. 🏗️

### 1. Hash Function Properties 🧮

The `keccak256` hash function (used in Ethereum) is like a magical blender that transforms input data into a fixed-size string of characters! 🧙‍♂️ Understanding its properties is crucial for implementing secure systems:

-   **Deterministic** 🔄: Same input always produces same output

    -   This property ensures that when a player creates a commitment, they can later prove it was their move by providing the same inputs
    -   For example, if Alice hashes "Rock" with salt "abc" and address "0x123", she'll always get the same hash value
    -   This determinism is essential for the verification phase of the commit-reveal pattern

-   **One-way** 🚫: Cannot reverse-engineer input from output

    -   Even if an attacker knows the hash value, they cannot determine the original move
    -   This is because hash functions are designed to be computationally infeasible to reverse
    -   For example, given a hash value like "0x1234...", there's no practical way to determine if it came from "Rock" or "Paper"

-   **Fixed-size** 📏: Always produces 32 bytes (64 hex characters)

    -   Regardless of input size, the output is always 32 bytes
    -   This makes storage and comparison efficient
    -   For example, "Rock" with a small salt and "Paper" with a large salt both produce 32-byte hashes

-   **Avalanche effect** 🌊: Small input changes cause large output changes

    -   Changing even one bit in the input completely changes the hash
    -   This prevents attackers from making educated guesses
    -   For example, changing "Rock" to "Paper" produces a completely different hash

-   **Collision-resistant** 🛡️: Different inputs rarely produce same output
    -   It's extremely unlikely that two different moves would produce the same hash
    -   This ensures each commitment is unique
    -   The probability of a collision is so low it can be considered impossible in practice

### 2. Commitment Structure 🏗️

A commitment is like a digital lockbox! 🔒 It's created by hashing three components together. Let's examine each component in detail and understand why it's necessary:

```solidity
bytes32 commitment = keccak256(abi.encodePacked(
    move,      // uint8 (Rock=1, Paper=2, Scissors=3)
    salt,      // bytes32 (random 32 bytes)
    address    // address (player's Ethereum address)
));
```

1. **Move (uint8)** 🎮

    ```solidity
    enum Move {
        NONE,    // 0
        ROCK,    // 1
        PAPER,   // 2
        SCISSORS // 3
    }
    ```

    - The move is represented as a uint8 (1 byte) to minimize storage and gas costs 💰
    - Using an enum makes the code more readable and type-safe 📝
    - The NONE value (0) is used to represent no move made yet ⏳
    - The actual moves (1, 2, 3) are chosen to be non-zero to distinguish from NONE 🔢
    - This compact representation is efficient for both storage and computation ⚡

2. **Salt (bytes32)** 🧂

    ```typescript
    const salt = ethers.randomBytes(32);
    ```

    - The salt is a random 32-byte value (256 bits) 🎲
    - It's generated using a cryptographically secure random number generator 🔐
    - The large size (256 bits) makes brute-forcing practically impossible 🛡️
    - Even if an attacker knows the move and address, they can't guess the salt 🕵️‍♂️
    - The salt must be stored securely because it's needed for the reveal phase 🔒
    - Without the salt, the commitment cannot be verified ❌
    - Each commitment should use a unique salt to prevent replay attacks 🔄

3. **Address (address)** 👤
    ```solidity
    address playerAddress = msg.sender;
    ```
    - The player's Ethereum address (20 bytes) is included in the hash 📝
    - This prevents replay attacks where one player's commitment could be reused 🛡️
    - It ensures each commitment is unique to a specific player 🔒
    - The address acts as a unique identifier in the commitment 🆔
    - Including the address makes the commitment player-specific 👤
    - This is crucial for maintaining game integrity 🎮

### 3. Encoding Process 🔄

The `abi.encodePacked` function is like a digital sandwich maker! 🥪 It combines our ingredients in a specific way. Let's understand how this works:

```solidity
// Example with Rock move
uint8 move = 1;  // ROCK
bytes32 salt = 0x1234...;  // 32 random bytes
address player = 0x1234...;  // 20 bytes

// Encoding process:
// 1. move (1 byte) + salt (32 bytes) + address (20 bytes)
// 2. Concatenated without padding or length prefixes
// 3. Total: 53 bytes input
bytes memory encoded = abi.encodePacked(move, salt, player);

// Final hash
bytes32 commitment = keccak256(encoded);
```

The encoding process works as follows:

1. **Component Sizes** 📏:

    - move: 1 byte (uint8) 📦
    - salt: 32 bytes (bytes32) 📦
    - address: 20 bytes 📦
    - Total: 53 bytes input 📊

2. **Concatenation** 🔗:

    - Components are concatenated in order 📝
    - No padding or length prefixes are added 🚫
    - This creates a compact representation 📦

3. **Why encodePacked** 🤔:

    - `abi.encode` would add padding and length prefixes 📦
    - `abi.encodePacked` creates a more efficient representation ⚡
    - The packed encoding is deterministic and consistent 🔄

4. **Byte Order** 🔢:
    - The move comes first (1 byte) 1️⃣
    - Then the salt (32 bytes) 3️⃣2️⃣
    - Finally the address (20 bytes) 2️⃣0️⃣
    - This order must be consistent between commit and reveal 🔄

### 4. Verification Process 🔍

During the reveal phase, the contract acts like a detective! 🕵️‍♂️ It verifies the commitment. Let's understand how this works:

```solidity
function verifyCommitment(
    bytes32 storedCommitment,
    Move move,
    bytes32 salt,
    address player
) public pure returns (bool) {
    bytes32 calculatedCommitment = keccak256(
        abi.encodePacked(move, salt, player)
    );
    return storedCommitment == calculatedCommitment;
}
```

The verification process involves several steps:

1. **Input Validation** ✅:

    - Check that the move is valid (not NONE) 🎮
    - Verify the salt is the correct size 📏
    - Confirm the player address matches 👤

2. **Commitment Calculation** 🧮:

    - Use the same encoding process as during commit 🔄
    - Hash the move, salt, and address together 🔗
    - This should produce the same hash as during commit ✅

3. **Comparison** ⚖️:

    - Compare the calculated hash with the stored commitment 🔍
    - They must match exactly for verification to pass ✅
    - Even a one-bit difference means verification fails ❌

4. **Security Checks** 🔒:
    - The function is marked `pure` because it doesn't modify state 📝
    - It only performs calculations and comparisons 🧮
    - This makes it gas-efficient and secure 💰

### 5. Security Analysis 🛡️

Let's analyze the security aspects in detail:

1. **Brute Force Protection** 💪

    - The 32-byte salt provides 2^256 possible values 🔢
    - Even with all Ethereum computing power, brute-forcing is impossible 🚫
    - Example calculation:
        - Assume 1 billion hash operations per second ⚡
        - 2^256 hashes would take 10^67 years ⏳
        - The universe is only 13.8 billion years old 🌌
    - This makes the system secure against brute force attacks 🛡️

2. **Replay Attack Prevention** 🔄

    ```solidity
    // Without address:
    commitment = keccak256(abi.encodePacked(move, salt));
    // Could be reused by different players
    // Alice's commitment could be used by Bob 👤

    // With address:
    commitment = keccak256(abi.encodePacked(move, salt, player));
    // Unique per player
    // Alice's commitment can only be used by Alice 👤
    ```

    - Including the address makes each commitment unique to a player 🔒
    - Even with the same move and salt, different addresses produce different hashes 🔄
    - This prevents one player from using another player's commitment 🛡️

3. **Move Integrity** 🔒
    ```solidity
    // Cannot change move after commitment
    bytes32 original = keccak256(abi.encodePacked(ROCK, salt, player));
    bytes32 changed = keccak256(abi.encodePacked(PAPER, salt, player));
    // original != changed
    ```
    - Once committed, a player cannot change their move 🚫
    - The hash of a different move will never match the original commitment ❌
    - This ensures the game remains fair ⚖️

### 6. Implementation Examples 💻

Let's look at practical implementations:

1. **Solidity Contract** 📝

    ```solidity
    function createCommitment(
        Move move,
        bytes32 salt,
        address player
    ) public pure returns (bytes32) {
        // Validate inputs
        require(move != Move.NONE, "Invalid move");

        // Create commitment
        bytes32 commitment = keccak256(
            abi.encodePacked(move, salt, player)
        );

        return commitment;
    }
    ```

    - The function is marked `pure` because it doesn't modify state 📝
    - Input validation ensures only valid moves are committed ✅
    - The commitment is created using the standard process 🔄

2. **TypeScript Frontend** 🖥️

    ```typescript
    const createCommitment = (
        move: Move,
        salt: string,
        address: string
    ): string => {
        // Validate inputs
        if (move === Move.NONE) {
            throw new Error("Invalid move");
        }

        // Create commitment using ethers.js
        const commitment = ethers.keccak256(
            ethers.solidityPacked(
                ["uint8", "bytes32", "address"],
                [move, salt, address]
            )
        );

        return commitment;
    };
    ```

    - Input validation matches the contract ✅
    - Uses ethers.js for consistent hashing 🔄
    - Returns the commitment as a hex string 📝

3. **Testing Verification** 🧪
    ```typescript
    it("Should verify commitments correctly", async () => {
        // Setup
        const move = Move.ROCK;
        const salt = ethers.randomBytes(32);
        const player = player1.address;

        // Create commitment
        const commitment = createCommitment(move, salt, player);

        // Verify commitment
        const verified = await contract.verifyCommitment(
            commitment,
            move,
            salt,
            player
        );

        // Assert
        expect(verified).to.be.true;
    });
    ```
    - Tests the complete commitment process 🔄
    - Verifies that valid commitments are accepted ✅
    - Ensures the system works as expected 🎯

### 7. Common Hashing Mistakes ❌

Let's examine common mistakes and how to avoid them:

1. **Incorrect Encoding** 🔄

    ```solidity
    // Wrong: Using encode instead of encodePacked
    bytes32 wrong = keccak256(abi.encode(move, salt, player));
    // Adds padding and length prefixes
    // Results in different hash than expected ❌

    // Correct: Using encodePacked
    bytes32 correct = keccak256(abi.encodePacked(move, salt, player));
    // Creates compact representation
    // Produces expected hash ✅
    ```

    - `abi.encode` adds padding and length prefixes 📦
    - This changes the input to the hash function 🔄
    - Results in different hash values ❌
    - Always use `abi.encodePacked` for commitments ✅

2. **Missing Components** 🚫

    ```solidity
    // Wrong: Missing salt
    bytes32 insecure = keccak256(abi.encodePacked(move, player));
    // Vulnerable to brute force attacks 💥

    // Wrong: Missing address
    bytes32 replayable = keccak256(abi.encodePacked(move, salt));
    // Vulnerable to replay attacks 🔄

    // Correct: All components
    bytes32 secure = keccak256(abi.encodePacked(move, salt, player));
    // Secure against both attacks 🛡️
    ```

    - Each component serves a specific security purpose 🔒
    - Missing any component creates vulnerabilities 💥
    - Always include all three components ✅

3. **Insecure Salt Generation** 🧂

    ```typescript
    // Wrong: Using Math.random()
    const insecureSalt = ethers.toUtf8Bytes(Math.random().toString());
    // Not cryptographically secure
    // Predictable and vulnerable 💥

    // Correct: Using crypto-secure RNG
    const secureSalt = ethers.randomBytes(32);
    // Cryptographically secure
    // Unpredictable and safe 🛡️
    ```

    - Regular random number generators are not secure 🚫
    - Use cryptographically secure RNG ✅
    - Ensure sufficient entropy 🎲

### 8. Gas Optimization 💰

Let's look at gas optimization techniques:

1. **Storage Optimization** 📦

    ```solidity
    // Store only the hash, not the components
    bytes32 public commitment;
    // 32 bytes storage
    // Efficient and secure ⚡

    // Instead of:
    // uint8 public move;    // 1 byte
    // bytes32 public salt;  // 32 bytes
    // address public player; // 20 bytes
    // Total: 53 bytes storage
    // Less efficient 💸
    ```

    - Storing only the hash is more gas-efficient ⚡
    - Original components can be verified but not extracted 🔒
    - This is both secure and cost-effective 💰

2. **Verification Optimization** ⚡

    ```solidity
    // Do verification in one step
    require(
        keccak256(abi.encodePacked(move, salt, msg.sender)) == commitment,
        "Invalid commitment"
    );
    // Single operation
    // Gas efficient ⚡

    // Instead of:
    // bytes32 calculated = keccak256(...);
    // require(calculated == commitment);
    // Two operations
    // Less gas efficient 💸
    ```

    - Combine operations where possible 🔄
    - Reduce storage operations 📦
    - Optimize for gas efficiency 💰

Understanding these hashing details is crucial for implementing a secure commit-reveal pattern. The combination of move, salt, and address creates a unique, verifiable, and secure commitment that cannot be forged or predicted. Each component serves a specific security purpose, and the implementation must be careful to maintain all security properties while optimizing for gas efficiency. 🎯

## Step-by-Step Implementation Guide

### Step 1: Smart Contract Modifications

1. **Update Game States**

    ```solidity
    enum GameState {
        WAITING,    // Initial state
        COMMITTED,  // Both players committed
        REVEALED,   // Both players revealed
        COMPLETED   // Game finished
    }
    ```

    - Add these states to your contract
    - Update all state checks in existing functions

2. **Modify Game Struct**

    ```solidity
    struct Game {
        // ... existing fields ...
        bytes32 player1Commitment;
        bytes32 player2Commitment;
    }
    ```

    - Add commitment fields for both players
    - Initialize them as `bytes32(0)` in game creation

3. **Implement Commit Function**

    ```solidity
    function commitMove(uint256 gameId, bytes32 commitment) external {
        Game storage game = games[gameId];
        require(game.state == GameState.COMMITTED, "Game not in commit phase");

        if (msg.sender == game.player1) {
            require(game.player1Commitment == bytes32(0), "Already committed");
            game.player1Commitment = commitment;
        } else if (msg.sender == game.player2) {
            require(game.player2Commitment == bytes32(0), "Already committed");
            game.player2Commitment = commitment;
        }

        if (game.player1Commitment != bytes32(0) &&
            game.player2Commitment != bytes32(0)) {
            game.state = GameState.REVEALED;
        }
    }
    ```

    - Add state transition checks
    - Store commitments for both players
    - Update game state when both players commit

4. **Implement Reveal Function**

    ```solidity
    function revealMove(uint256 gameId, Move move, bytes32 salt) external {
        Game storage game = games[gameId];
        require(game.state == GameState.REVEALED, "Game not in reveal phase");

        bytes32 commitment = keccak256(abi.encodePacked(move, salt, msg.sender));

        if (msg.sender == game.player1) {
            require(commitment == game.player1Commitment, "Invalid commitment");
            game.player1Move = move;
        } else {
            require(commitment == game.player2Commitment, "Invalid commitment");
            game.player2Move = move;
        }

        if (game.player1Move != Move.NONE && game.player2Move != Move.NONE) {
            _determineWinner(gameId);
        }
    }
    ```

    - Verify commitments match
    - Store actual moves
    - Determine winner when both moves revealed

### Step 2: Frontend Implementation

1. **Update Game Interface**

    ```typescript
    interface Game {
        // ... existing fields ...
        player1Commitment: string;
        player2Commitment: string;
    }
    ```

    - Add commitment fields to match contract

2. **Implement Commitment Generation**

    ```typescript
    const generateCommitment = (move: Move, salt: string, address: string) => {
        return ethers.keccak256(
            ethers.solidityPacked(
                ["uint8", "bytes32", "address"],
                [move, salt, address]
            )
        );
    };
    ```

    - Create helper function for commitment generation
    - Use same encoding as contract

3. **Implement Commit Handler**

    ```typescript
    const handleCommitMove = async (gameId: bigint, move: Move) => {
        try {
            // Generate random salt
            const salt = ethers.randomBytes(32);

            // Create commitment
            const commitment = generateCommitment(move, salt, address);

            // Store salt locally
            localStorage.setItem(`game-${gameId}-salt`, salt);

            // Call contract
            await commitMove({
                functionName: "commitMove",
                args: [gameId, commitment],
            });
        } catch (error) {
            console.error("Error committing move:", error);
        }
    };
    ```

    - Generate random salt
    - Create commitment
    - Store salt for reveal
    - Call contract

4. **Implement Reveal Handler**

    ```typescript
    const handleRevealMove = async (gameId: bigint, move: Move) => {
        try {
            const salt = localStorage.getItem(`game-${gameId}-salt`);
            if (!salt) throw new Error("No salt found");

            await revealMove({
                functionName: "revealMove",
                args: [gameId, move, salt],
            });
        } catch (error) {
            console.error("Error revealing move:", error);
        }
    };
    ```

    - Retrieve stored salt
    - Call contract with move and salt

5. **Update UI Components**

    ```typescript
    const GameButtons = ({
        gameId,
        state,
    }: {
        gameId: bigint;
        state: number;
    }) => {
        if (state === GameState.COMMITTED) {
            return (
                <div>
                    <button onClick={() => handleCommitMove(gameId, Move.ROCK)}>
                        Commit Rock
                    </button>
                    {/* ... other moves ... */}
                </div>
            );
        }

        if (state === GameState.REVEALED) {
            return (
                <div>
                    <button onClick={() => handleRevealMove(gameId, Move.ROCK)}>
                        Reveal Rock
                    </button>
                    {/* ... other moves ... */}
                </div>
            );
        }

        return null;
    };
    ```

    - Create state-specific UI components
    - Handle different game phases

### Step 3: Testing Implementation

1. **Test Commitment Generation**

    ```typescript
    it("Should generate valid commitments", async () => {
        const move = Move.ROCK;
        const salt = ethers.randomBytes(32);
        const commitment = generateCommitment(move, salt, player1.address);

        // Verify commitment can be verified
        const verified = await contract.verifyCommitment(
            commitment,
            move,
            salt,
            player1.address
        );
        expect(verified).to.be.true;
    });
    ```

2. **Test Commit Phase**

    ```typescript
    it("Should allow players to commit moves", async () => {
        // Create game
        await contract.createGame({ value: parseEther("0.1") });
        const gameId = (await contract.gameCount()) - 1n;

        // Player 1 commits
        const salt1 = ethers.randomBytes(32);
        const commitment1 = generateCommitment(
            Move.ROCK,
            salt1,
            player1.address
        );
        await contract.connect(player1).commitMove(gameId, commitment1);

        // Verify commitment stored
        const game = await contract.getGame(gameId);
        expect(game.player1Commitment).to.equal(commitment1);
    });
    ```

3. **Test Reveal Phase**

    ```typescript
    it("Should allow players to reveal moves", async () => {
        // ... setup game and commitments ...

        // Player 1 reveals
        await contract.connect(player1).revealMove(gameId, Move.ROCK, salt1);

        // Verify move stored
        const game = await contract.getGame(gameId);
        expect(game.player1Move).to.equal(Move.ROCK);
    });
    ```

## Security Considerations

1. **Salt Generation**

    - Use cryptographically secure random number generator
    - Store salts securely (localStorage is sufficient for this demo)
    - Never reuse salts

2. **Commitment Verification**

    - Verify all components (move, salt, address)
    - Use same encoding in frontend and contract
    - Check commitments match exactly

3. **State Management**

    - Enforce strict state transitions
    - Prevent out-of-order actions
    - Handle edge cases (e.g., player disconnects)

4. **Error Handling**
    - Provide clear error messages
    - Handle commitment mismatches
    - Manage timeouts and retries

## Common Pitfalls and Solutions

1. **Commitment Mismatch**

    - Problem: Commitment verification fails
    - Solution: Ensure same encoding used everywhere
    - Debug: Log and compare commitment components

2. **State Confusion**

    - Problem: Wrong state for action
    - Solution: Add clear state checks and messages
    - Debug: Log state transitions

3. **Salt Management**

    - Problem: Lost or invalid salt
    - Solution: Implement robust storage
    - Debug: Verify salt format and storage

4. **Gas Optimization**
    - Problem: High gas costs
    - Solution: Optimize storage and computations
    - Debug: Profile gas usage

## Best Practices

1. **Code Organization**

    - Separate commit and reveal logic
    - Use helper functions for common operations
    - Document state transitions

2. **Testing**

    - Test all state transitions
    - Verify commitment generation
    - Test edge cases

3. **Security**

    - Use secure random number generation
    - Implement proper access control
    - Handle all error cases

4. **User Experience**
    - Provide clear feedback
    - Handle errors gracefully
    - Guide users through phases

## Conclusion

The commit-reveal pattern adds significant security to the Rock Paper Scissors game. While more complex than the original implementation, the benefits in terms of fairness and security make it worthwhile, especially for games involving betting or valuable outcomes.

Remember to:

1. Test thoroughly
2. Document state transitions
3. Handle all error cases
4. Provide clear user feedback
5. Optimize for gas efficiency

With these steps and considerations, you can implement a secure and fair Rock Paper Scissors game on the blockchain.

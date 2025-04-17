"use client";

import { useEffect, useState } from "react";
import { encodeAbiParameters, encodePacked, formatEther, keccak256, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import {
  useScaffoldContract,
  useScaffoldReadContract,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
} from "~~/hooks/scaffold-eth";

interface Game {
  id: bigint;
  player1: `0x${string}`;
  player2: `0x${string}`;
  state: number;
  player1Commitment: `0x${string}`;
  player2Commitment: `0x${string}`;
  player1Move: number;
  player2Move: number;
  result: number;
  betAmount: bigint;
}

enum GameState {
  WAITING = 0,
  COMMITTED = 1,
  REVEALED = 2,
  COMPLETED = 3,
}

enum Move {
  NONE = 0,
  ROCK = 1,
  PAPER = 2,
  SCISSORS = 3,
}

enum GameResult {
  NONE = 0,
  PLAYER1_WIN = 1,
  PLAYER2_WIN = 2,
  DRAW = 3,
}

export default function Home() {
  const { address } = useAccount();
  const [games, setGames] = useState<Game[]>([]);
  const [betAmount, setBetAmount] = useState("0.001");
  const [selectedMove, setSelectedMove] = useState<number>(0);
  const [movePassword, setMovePassword] = useState<string>("");
  const [revealPassword, setRevealPassword] = useState<string>("");
  const [moveCommitments, setMoveCommitments] = useState<Record<string, { move: number }>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("moveCommitments");
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  // Save commitments to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("moveCommitments", JSON.stringify(moveCommitments));
    }
  }, [moveCommitments]);

  // Read game count
  const { data: gameCount } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "gameCount",
    watch: true,
  });

  // Get contract instance for reading game data
  const { data: contract } = useScaffoldContract({
    contractName: "YourContract",
  });

  // Write functions
  const { writeContractAsync: createGame } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const { writeContractAsync: joinGame } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const { writeContractAsync: commitMove } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  const { writeContractAsync: revealMove } = useScaffoldWriteContract({
    contractName: "YourContract",
  });

  // Debounce the game fetching
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const fetchGames = async () => {
      if (!gameCount || !contract) return;

      const count = Number(gameCount);

      // Only fetch the latest game
      if (count > 0) {
        try {
          const gameData = await contract.read.getGame([BigInt(count - 1)]);

          const game = {
            id: BigInt(count - 1),
            player1: gameData[0] as `0x${string}`,
            player2: gameData[1] as `0x${string}`,
            state: Number(gameData[2]),
            player1Commitment: gameData[3] as `0x${string}`,
            player2Commitment: gameData[4] as `0x${string}`,
            player1Move: Number(gameData[5]),
            player2Move: Number(gameData[6]),
            result: Number(gameData[7]),
            betAmount: BigInt(gameData[8]),
          };

          // Always show the latest game, regardless of state
          setGames([game]);
        } catch (error) {
          console.error(`Error fetching game:`, error);
        }
      } else {
        setGames([]);
      }
    };

    // Debounce the fetch to prevent rapid updates
    timeoutId = setTimeout(fetchGames, 1000);

    return () => clearTimeout(timeoutId);
  }, [gameCount, contract]);

  // Watch contract events
  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GameCreated",
    onLogs: logs => {
      console.log("🎮 New game created!");
      setGames([]);
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "MoveCommitted",
    onLogs: logs => {
      const [gameId, player] = logs[0].args as unknown as [bigint, `0x${string}`];
      console.log(`🔒 Move committed by ${player}`);
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "MoveRevealed",
    onLogs: logs => {
      const [gameId, player, move] = logs[0].args as unknown as [bigint, `0x${string}`, number];
      console.log(`🎯 Move revealed: ${Move[move]}`);
    },
  });

  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GameCompleted",
    onLogs: logs => {
      const [gameId, winner] = logs[0].args as unknown as [bigint, `0x${string}`];
      console.log(`🏆 Game completed! Winner: ${winner}`);
    },
  });

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

  const handleCommitMove = async (gameId: bigint, move: number) => {
    try {
      if (!address) return;

      // Ensure password is provided
      if (!movePassword) {
        console.error("Password required for move commitment");
        return;
      }

      // Fetch the game data to check state
      const game = games.find(g => g.id === gameId);
      if (!game) {
        console.error("Game not found");
        return;
      }

      console.log("Debug - Game State:", {
        gameId: gameId.toString(),
        state: game.state,
        player1: game.player1,
        player2: game.player2,
        player1Commitment: game.player1Commitment,
        player2Commitment: game.player2Commitment,
      });

      // Generate salt from password + gameId + address
      const saltData = encodePacked(["string", "uint256", "address"], [movePassword, gameId, address]);
      const salt = keccak256(saltData);

      console.log("Debug - Commit Move:", {
        gameId: gameId.toString(),
        move,
        salt,
        address,
      });

      // Calculate the commitment hash using encodePacked
      const encodedData = encodePacked(["uint8", "bytes32", "address"], [move, salt, address]);
      const commitment = keccak256(encodedData);

      console.log("Debug - Commit Phase:", {
        commitment,
        encodedData,
      });

      // Store only the move for later reveal
      setMoveCommitments(prev => ({
        ...prev,
        [gameId.toString()]: { move },
      }));

      await commitMove({
        functionName: "commitMove",
        args: [gameId, commitment],
      });

      // Clear the password field after successful commit
      setMovePassword("");
      setSelectedMove(0);
    } catch (error) {
      console.error("Error committing move:", error);
    }
  };

  const handleRevealMove = async (gameId: bigint) => {
    try {
      if (!address) {
        console.error("No address found");
        return;
      }

      const commitment = moveCommitments[gameId.toString()];
      if (!commitment) {
        console.error("No commitment found for this game");
        return;
      }

      if (!revealPassword) {
        console.error("Password required to reveal move");
        return;
      }

      // Regenerate salt from entered password
      const saltData = encodePacked(["string", "uint256", "address"], [revealPassword, gameId, address]);
      const salt = keccak256(saltData);

      // Verify the password by checking if it generates the same commitment
      const encodedData = encodePacked(["uint8", "bytes32", "address"], [commitment.move, salt, address]);
      const generatedCommitment = keccak256(encodedData);

      // Get the stored commitment from the game
      const game = games.find(g => g.id === gameId);
      if (!game) {
        console.error("Game not found");
        return;
      }

      const storedCommitment = address === game.player1 ? game.player1Commitment : game.player2Commitment;

      // Verify the password generates the correct commitment
      if (generatedCommitment !== storedCommitment) {
        console.error("Invalid password");
        return;
      }

      console.log("Debug - Reveal Move:", {
        gameId: gameId.toString(),
        move: commitment.move,
        salt,
        address,
      });

      // Ensure move is a valid uint8
      const move = commitment.move & 0xff;

      await revealMove({
        functionName: "revealMove",
        args: [gameId, move, salt],
      });

      // Clear the reveal password
      setRevealPassword("");
    } catch (error) {
      console.error("Error revealing move:", error);
    }
  };

  const getGameState = (state: number) => {
    switch (state) {
      case GameState.WAITING:
        return "Waiting for Player 2";
      case GameState.COMMITTED:
        return "Committing Moves";
      case GameState.REVEALED:
        return "Revealing Moves";
      case GameState.COMPLETED:
        return "Game Completed";
      default:
        return "Unknown";
    }
  };

  const isPlayersTurn = (game: Game) => {
    if (!address || !game) return false;

    // Check if it's commit phase and player hasn't committed
    if (game.state === GameState.COMMITTED) {
      if (
        game.player1 === address &&
        game.player1Commitment === "0x0000000000000000000000000000000000000000000000000000000000000000"
      )
        return true;
      if (
        game.player2 === address &&
        game.player2Commitment === "0x0000000000000000000000000000000000000000000000000000000000000000"
      )
        return true;
    }

    // Check if it's reveal phase and player hasn't revealed
    if (game.state === GameState.REVEALED) {
      if (game.player1 === address && game.player1Move === Move.NONE) return true;
      if (game.player2 === address && game.player2Move === Move.NONE) return true;
    }

    return false;
  };

  const getGameResult = (result: number) => {
    switch (result) {
      case 1:
        return "Player 1 Wins";
      case 2:
        return "Player 2 Wins";
      case 3:
        return "Draw";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
      <h1 className="text-4xl font-bold">Rock Paper Scissors</h1>

      <div className="flex flex-col gap-4">
        <div className="form-control">
          <label className="label">
            <span className="label-text">Bet Amount (ETH)</span>
          </label>
          <div className="join">
            <input
              type="number"
              value={betAmount}
              onChange={e => setBetAmount(e.target.value)}
              className="input input-bordered join-item"
              placeholder="0.001"
              step="0.001"
              min="0"
            />
            <span className="btn join-item no-animation">ETH</span>
          </div>
          <label className="label">
            <span className="label-text-alt">Minimum bet: 0.001 ETH</span>
          </label>
        </div>
        <button className="btn btn-primary" onClick={handleCreateGame}>
          Create New Game
        </button>
      </div>

      {games.map(game => (
        <div key={game.id.toString()} className="card bg-base-200 shadow-xl w-full max-w-2xl">
          <div className="card-body">
            <div className="flex flex-col gap-2">
              <div>Game #{game.id.toString()}</div>
              <div>
                <span className="font-semibold">Stake:</span> {formatEther(game.betAmount)} ETH per player
              </div>
              <div>
                Player 1: <Address address={game.player1} />
                {game.player1Move !== Move.NONE && <span className="ml-2">(Moved)</span>}
              </div>
              <div>
                Player 2:{" "}
                {game.player2 === "0x0000000000000000000000000000000000000000" ? (
                  "Waiting..."
                ) : (
                  <>
                    <Address address={game.player2} />
                    {game.player2Move !== Move.NONE && <span className="ml-2">(Moved)</span>}
                  </>
                )}
              </div>
              <div>State: {getGameState(game.state)}</div>

              {game.state === GameState.COMPLETED && (
                <div className="font-bold text-lg mt-2">
                  {game.result === GameResult.PLAYER1_WIN && "🎉 Player 1 Wins!"}
                  {game.result === GameResult.PLAYER2_WIN && "🎉 Player 2 Wins!"}
                  {game.result === GameResult.DRAW && "🤝 It's a Draw!"}
                </div>
              )}
            </div>

            {/* Game Actions */}
            {game.state === GameState.WAITING && address !== game.player1 && (
              <button className="btn btn-primary mt-4" onClick={() => handleJoinGame(game.id)}>
                Join Game
              </button>
            )}

            {game.state === GameState.COMMITTED && isPlayersTurn(game) && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Move Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter a password for your move"
                    className="input input-bordered"
                    value={movePassword}
                    onChange={e => setMovePassword(e.target.value)}
                  />
                  <label className="label">
                    <span className="label-text-alt text-warning">
                      Remember this password! You'll need it to reveal your move.
                    </span>
                  </label>
                </div>

                <div className="flex gap-2 justify-center">
                  <button
                    className={`btn ${selectedMove === Move.ROCK ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setSelectedMove(Move.ROCK)}
                    disabled={!movePassword}
                  >
                    Rock
                  </button>
                  <button
                    className={`btn ${selectedMove === Move.PAPER ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setSelectedMove(Move.PAPER)}
                    disabled={!movePassword}
                  >
                    Paper
                  </button>
                  <button
                    className={`btn ${selectedMove === Move.SCISSORS ? "btn-primary" : "btn-outline"}`}
                    onClick={() => setSelectedMove(Move.SCISSORS)}
                    disabled={!movePassword}
                  >
                    Scissors
                  </button>
                </div>

                {selectedMove !== Move.NONE && (
                  <button
                    className="btn btn-primary"
                    onClick={() => handleCommitMove(game.id, selectedMove)}
                    disabled={!movePassword}
                  >
                    Commit {Move[selectedMove]}
                  </button>
                )}
              </div>
            )}

            {game.state === GameState.REVEALED && isPlayersTurn(game) && (
              <div className="flex flex-col gap-4 mt-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Enter your move password to reveal</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter the password you used when committing"
                    className="input input-bordered"
                    value={revealPassword}
                    onChange={e => setRevealPassword(e.target.value)}
                  />
                </div>
                <button
                  className="btn btn-primary"
                  onClick={() => handleRevealMove(game.id)}
                  disabled={!revealPassword}
                >
                  Reveal Move
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

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
  PLAYING = 1,
  COMPLETED = 2,
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
  const [moveCommitments, setMoveCommitments] = useState<Record<string, { move: number; salt: `0x${string}` }>>(() => {
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

      // Generate a random salt using browser's crypto API
      const randomBytes = new Uint8Array(32);
      crypto.getRandomValues(randomBytes);
      const salt = `0x${Array.from(randomBytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")}` as `0x${string}`;

      console.log("Debug - Commit Move:", {
        gameId: gameId.toString(),
        move,
        salt,
        address,
      });

      // Calculate the commitment hash using encodePacked
      const encodedData = encodePacked(["uint8", "bytes32", "address"], [move, salt, address]);

      console.log("Debug - Encoded Data:", encodedData);

      const commitment = keccak256(encodedData);

      console.log("Debug - Commit Phase:", {
        commitment,
        encodedData,
      });

      // Store the move and salt for later reveal
      setMoveCommitments(prev => ({
        ...prev,
        [gameId.toString()]: { move, salt },
      }));

      await commitMove({
        functionName: "commitMove",
        args: [gameId, commitment],
      });
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

      // Fetch the game data to get the stored commitment
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

      const storedCommitment = address === game.player1 ? game.player1Commitment : game.player2Commitment;

      console.log("Debug - Reveal Move:", {
        gameId: gameId.toString(),
        storedMove: commitment.move,
        storedSalt: commitment.salt,
        address,
        storedCommitment,
      });

      // Ensure move is a valid uint8
      const move = commitment.move & 0xff;

      // Recalculate commitment using encodePacked
      const encodedData = encodePacked(["uint8", "bytes32", "address"], [move, commitment.salt, address]);

      console.log("Debug - Encoded Data:", encodedData);

      const recalculatedCommitment = keccak256(encodedData);

      console.log("Debug - Commitments:", {
        stored: storedCommitment,
        recalculated: recalculatedCommitment,
        match: storedCommitment === recalculatedCommitment,
        encodedData,
      });

      await revealMove({
        functionName: "revealMove",
        args: [gameId, move, commitment.salt],
      });
    } catch (error) {
      console.error("Error revealing move:", error);
    }
  };

  const getGameState = (state: number) => {
    switch (state) {
      case GameState.WAITING:
        return "WAITING";
      case GameState.PLAYING:
        return "PLAYING";
      case GameState.COMPLETED:
        return "COMPLETED";
      default:
        return "UNKNOWN";
    }
  };

  const isPlayersTurn = (game: Game) => {
    if (!address || !game) return false;
    if (game.state !== GameState.PLAYING) return false;

    if (game.player1 === address && game.player1Move === Move.NONE) return true;
    if (game.player2 === address && game.player2Move === Move.NONE) return true;
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
        <input
          type="number"
          value={betAmount}
          onChange={e => setBetAmount(e.target.value)}
          className="input input-bordered"
          placeholder="Bet amount in ETH"
        />
        <button className="btn btn-primary" onClick={handleCreateGame}>
          Create New Game
        </button>
      </div>

      {games.map(game => (
        <div key={game.id.toString()} className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <div className="flex flex-col gap-2">
              <div>Bet: {Number(game.betAmount) / 1e18} ETH</div>
              <div>
                Player 1: <Address address={game.player1} />
                {game.player1Move !== Move.NONE && <span className="ml-2">(Played: {Move[game.player1Move]})</span>}
              </div>
              <div>
                Player 2: {game.player2 ? <Address address={game.player2} /> : "Waiting..."}
                {game.player2Move !== Move.NONE && <span className="ml-2">(Played: {Move[game.player2Move]})</span>}
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

            {game.state === GameState.WAITING && (
              <button className="btn btn-primary" onClick={() => handleJoinGame(game.id)}>
                Join Game
              </button>
            )}

            {game.state === GameState.PLAYING && isPlayersTurn(game) && (
              <div className="flex gap-2">
                <button className="btn btn-primary" onClick={() => handleCommitMove(game.id, Move.ROCK)}>
                  Rock
                </button>
                <button className="btn btn-primary" onClick={() => handleCommitMove(game.id, Move.PAPER)}>
                  Paper
                </button>
                <button className="btn btn-primary" onClick={() => handleCommitMove(game.id, Move.SCISSORS)}>
                  Scissors
                </button>
              </div>
            )}
          </div>
        </div>
      ))}

      {games.map(game => (
        <div key={game.id.toString()} className="bg-base-100 p-8 rounded-xl shadow-lg w-full max-w-md">
          <h2 className="text-2xl font-bold mb-4">Game {game.id.toString()}</h2>

          <div className="mb-4">
            <div>
              Player 1: <Address address={game.player1} />
            </div>
            <div>
              Player 2:{" "}
              {game.player2 === "0x0000000000000000000000000000000000000000" ? (
                "Waiting..."
              ) : (
                <Address address={game.player2} />
              )}
            </div>
            <div>Bet Amount: {Number(game.betAmount) / 1e18} ETH</div>
          </div>

          {game.state === 0 && address !== game.player1 && (
            <button className="btn btn-primary w-full" onClick={() => handleJoinGame(game.id)}>
              Join Game
            </button>
          )}

          {game.state === 1 && (
            <div>
              <p className="mb-4">Commit your move:</p>
              <div className="flex gap-4 mb-4">
                <button
                  className={`btn ${selectedMove === 1 ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedMove(1)}
                >
                  Rock
                </button>
                <button
                  className={`btn ${selectedMove === 2 ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedMove(2)}
                >
                  Paper
                </button>
                <button
                  className={`btn ${selectedMove === 3 ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedMove(3)}
                >
                  Scissors
                </button>
              </div>
              {selectedMove !== 0 && (
                <button className="btn btn-primary w-full" onClick={() => handleCommitMove(game.id, selectedMove)}>
                  Commit Move
                </button>
              )}
            </div>
          )}

          {game.state === 2 && (
            <button className="btn btn-primary w-full" onClick={() => handleRevealMove(game.id)}>
              Reveal Move
            </button>
          )}

          {game.state === 3 && (
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">
                {game.result === 1 && "🎉 Player 1 Wins!"}
                {game.result === 2 && "🎉 Player 2 Wins!"}
                {game.result === 3 && "🤝 It's a Draw!"}
              </h3>
              <p className="text-sm text-gray-500">
                {game.player1Move !== 0 && `Player 1 played: ${Move[game.player1Move]}`}
                {game.player2Move !== 0 && `Player 2 played: ${Move[game.player2Move]}`}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

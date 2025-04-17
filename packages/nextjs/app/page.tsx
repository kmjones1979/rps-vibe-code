"use client";

import { useEffect, useState } from "react";
import { hexToBigInt, parseEther } from "viem";
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

  // Read game count
  const { data: gameCount } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "gameCount",
    watch: true,
  });

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

  const { writeContractAsync: makeMove } = useScaffoldWriteContract({
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
            player1Move: Number(gameData[3]),
            player2Move: Number(gameData[4]),
            result: Number(gameData[5]),
            betAmount: BigInt(gameData[6]),
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

  // Subscribe to GameCreated events
  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GameCreated",
    onLogs: logs => {
      logs.forEach(log => {
        if (log.args?.gameId) {
          console.log("🎮 New game created!");
          // Clear the previous game when a new one is created
          setGames([]);
        }
      });
    },
  });

  // Subscribe to MoveMade events
  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "MoveMade",
    onLogs: logs => {
      logs.forEach(log => {
        if (log.args?.gameId && log.args?.player && log.args?.move) {
          console.log(`🎯 Move made: ${Move[Number(log.args.move)]}`);
          // Force a refresh of the game data after a move
          if (gameCount) {
            const count = Number(gameCount);
            if (count > 0) {
              contract?.read.getGame([BigInt(count - 1)]).then(gameData => {
                const game = {
                  id: BigInt(count - 1),
                  player1: gameData[0] as `0x${string}`,
                  player2: gameData[1] as `0x${string}`,
                  state: Number(gameData[2]),
                  player1Move: Number(gameData[3]),
                  player2Move: Number(gameData[4]),
                  result: Number(gameData[5]),
                  betAmount: BigInt(gameData[6]),
                };
                setGames([game]);
              });
            }
          }
        }
      });
    },
  });

  // Subscribe to GameCompleted events
  useScaffoldWatchContractEvent({
    contractName: "YourContract",
    eventName: "GameCompleted",
    onLogs: logs => {
      logs.forEach(log => {
        if (log.args?.gameId) {
          console.log(`🏆 Game over! Result: ${GameResult[Number(log.args.result)]}`);
        }
      });
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
                <button className="btn btn-primary" onClick={() => handleMakeMove(game.id, Move.ROCK)}>
                  Rock
                </button>
                <button className="btn btn-primary" onClick={() => handleMakeMove(game.id, Move.PAPER)}>
                  Paper
                </button>
                <button className="btn btn-primary" onClick={() => handleMakeMove(game.id, Move.SCISSORS)}>
                  Scissors
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

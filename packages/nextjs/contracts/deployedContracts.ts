/**
 * This file is autogenerated by Scaffold-ETH.
 * You should not edit it manually or your changes might be overwritten.
 */
import { GenericContractsDeclaration } from "~~/utils/scaffold-eth/contract";

const deployedContracts = {
  31337: {
    YourContract: {
      address: "0xa513E6E4b8f2a923D98304ec87F64353C4D5C853",
      abi: [
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "winner",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "amount",
              type: "uint256",
            },
          ],
          name: "GameCompleted",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "player1",
              type: "address",
            },
            {
              indexed: false,
              internalType: "uint256",
              name: "betAmount",
              type: "uint256",
            },
          ],
          name: "GameCreated",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "player2",
              type: "address",
            },
          ],
          name: "GameJoined",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "player",
              type: "address",
            },
          ],
          name: "MoveCommitted",
          type: "event",
        },
        {
          anonymous: false,
          inputs: [
            {
              indexed: true,
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              indexed: true,
              internalType: "address",
              name: "player",
              type: "address",
            },
            {
              indexed: false,
              internalType: "enum YourContract.Move",
              name: "move",
              type: "uint8",
            },
          ],
          name: "MoveRevealed",
          type: "event",
        },
        {
          inputs: [],
          name: "MIN_BET",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              internalType: "bytes32",
              name: "commitment",
              type: "bytes32",
            },
          ],
          name: "commitMove",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "betAmount",
              type: "uint256",
            },
          ],
          name: "createGame",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [],
          name: "gameCount",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          name: "games",
          outputs: [
            {
              internalType: "address",
              name: "player1",
              type: "address",
            },
            {
              internalType: "address",
              name: "player2",
              type: "address",
            },
            {
              internalType: "enum YourContract.GameState",
              name: "state",
              type: "uint8",
            },
            {
              internalType: "bytes32",
              name: "player1Commitment",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "player2Commitment",
              type: "bytes32",
            },
            {
              internalType: "enum YourContract.Move",
              name: "player1Move",
              type: "uint8",
            },
            {
              internalType: "enum YourContract.Move",
              name: "player2Move",
              type: "uint8",
            },
            {
              internalType: "enum YourContract.GameResult",
              name: "result",
              type: "uint8",
            },
            {
              internalType: "uint256",
              name: "betAmount",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
          ],
          name: "getGame",
          outputs: [
            {
              internalType: "address",
              name: "player1",
              type: "address",
            },
            {
              internalType: "address",
              name: "player2",
              type: "address",
            },
            {
              internalType: "enum YourContract.GameState",
              name: "state",
              type: "uint8",
            },
            {
              internalType: "bytes32",
              name: "player1Commitment",
              type: "bytes32",
            },
            {
              internalType: "bytes32",
              name: "player2Commitment",
              type: "bytes32",
            },
            {
              internalType: "enum YourContract.Move",
              name: "player1Move",
              type: "uint8",
            },
            {
              internalType: "enum YourContract.Move",
              name: "player2Move",
              type: "uint8",
            },
            {
              internalType: "enum YourContract.GameResult",
              name: "result",
              type: "uint8",
            },
            {
              internalType: "uint256",
              name: "betAmount",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
          ],
          name: "joinGame",
          outputs: [],
          stateMutability: "payable",
          type: "function",
        },
        {
          inputs: [
            {
              internalType: "uint256",
              name: "gameId",
              type: "uint256",
            },
            {
              internalType: "enum YourContract.Move",
              name: "move",
              type: "uint8",
            },
            {
              internalType: "bytes32",
              name: "salt",
              type: "bytes32",
            },
          ],
          name: "revealMove",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      inheritedFunctions: {},
    },
  },
} as const;

export default deployedContracts satisfies GenericContractsDeclaration;

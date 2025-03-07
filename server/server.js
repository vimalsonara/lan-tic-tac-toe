// server.js
const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });

const games = new Map();

server.on("connection", (socket) => {
	let gameId = null;
	let playerSymbol = null;

	// Find an available game or create a new one
	for (const [id, game] of games) {
		if (game.players.length === 1) {
			gameId = id;
			playerSymbol = "O";
			game.players.push(socket);
			break;
		}
	}

	if (!gameId) {
		gameId = Date.now().toString();
		playerSymbol = "X";
		games.set(gameId, {
			players: [socket],
			board: Array(9).fill(""),
			currentPlayer: "X",
		});
	}

	const game = games.get(gameId);

	// Send initial game state to the player
	socket.send(
		JSON.stringify({
			type: "init",
			symbol: playerSymbol,
		}),
	);

	// Start game if we have two players
	if (game.players.length === 2) {
		broadcastGameState(game);
	}

	socket.on("message", (message) => {
		const data = JSON.parse(message);

		if (data.type === "move") {
			const game = games.get(gameId);
			if (
				!game ||
				game.board[data.index] ||
				game.currentPlayer !== playerSymbol
			) {
				return;
			}

			game.board[data.index] = playerSymbol;
			game.currentPlayer = playerSymbol === "X" ? "O" : "X";

			broadcastGameState(game);
		}
	});

	socket.on("close", () => {
		const game = games.get(gameId);
		if (game) {
			game.players = game.players.filter((p) => p !== socket);
			if (game.players.length === 0) {
				games.delete(gameId);
			} else {
				game.players[0].send(
					JSON.stringify({
						type: "message",
						text: "Opponent disconnected",
					}),
				);
			}
		}
	});
});

function broadcastGameState(game) {
	const gameState = {
		type: "gameState",
		board: game.board,
		currentPlayer: game.currentPlayer,
	};

	game.players.forEach((player) => {
		player.send(JSON.stringify(gameState));
	});
}

console.log("WebSocket server running on port 3000");

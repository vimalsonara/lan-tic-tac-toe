const WebSocket = require("ws");
const server = new WebSocket.Server({ port: 3000 });
const rooms = new Map();

server.on("connection", (socket) => {
	let roomId = null;
	let playerSymbol = null;

	socket.on("message", (message) => {
		const data = JSON.parse(message);

		// Handle different message types
		switch (data.type) {
			case "create_room":
				// Create a new room
				roomId = generateRoomId();
				playerSymbol = "X";
				rooms.set(roomId, {
					id: roomId,
					players: [socket],
					board: Array(9).fill(""),
					currentPlayer: "X",
					gameActive: true,
				});

				// Send room info to the creator
				socket.send(
					JSON.stringify({
						type: "room_created",
						roomId: roomId,
						symbol: playerSymbol,
					}),
				);
				break;

			case "join_room":
				// Join an existing room
				roomId = data.roomId;
				const room = rooms.get(roomId);

				if (!room) {
					socket.send(
						JSON.stringify({
							type: "error",
							message: "Room does not exist",
						}),
					);
					return;
				}

				if (room.players.length >= 2) {
					socket.send(
						JSON.stringify({
							type: "error",
							message: "Room is full",
						}),
					);
					return;
				}

				playerSymbol = "O";
				room.players.push(socket);

				// Send init data to the joining player
				socket.send(
					JSON.stringify({
						type: "room_joined",
						roomId: roomId,
						symbol: playerSymbol,
					}),
				);

				// Notify room creator that someone joined
				room.players[0].send(
					JSON.stringify({
						type: "opponent_joined",
					}),
				);

				// Start game by sending initial state to both players
				broadcastGameState(room);
				break;

			case "move":
				// Handle player moves
				const currentRoom = rooms.get(roomId);

				if (
					!currentRoom ||
					!currentRoom.gameActive ||
					currentRoom.board[data.index] ||
					currentRoom.currentPlayer !== playerSymbol
				) {
					return;
				}

				currentRoom.board[data.index] = playerSymbol;

				// Check for winner or draw
				const result = checkGameResult(currentRoom.board);

				if (result.status !== "active") {
					currentRoom.gameActive = false;
					broadcastGameResult(currentRoom, result);
				} else {
					// Continue game
					currentRoom.currentPlayer = playerSymbol === "X" ? "O" : "X";
					broadcastGameState(currentRoom);
				}
				break;

			case "reset_game":
				// Reset the game in the current room
				const roomToReset = rooms.get(roomId);
				if (roomToReset) {
					roomToReset.board = Array(9).fill("");
					roomToReset.currentPlayer = "X";
					roomToReset.gameActive = true;
					broadcastGameState(roomToReset);
				}
				break;

			case "list_rooms":
				// Return list of available rooms (rooms with only one player)
				const availableRooms = [];
				for (const [id, room] of rooms) {
					if (room.players.length === 1) {
						availableRooms.push({ id: id });
					}
				}
				socket.send(
					JSON.stringify({
						type: "room_list",
						rooms: availableRooms,
					}),
				);
				break;
		}
	});

	socket.on("close", () => {
		if (roomId) {
			const room = rooms.get(roomId);
			if (room) {
				room.players = room.players.filter((p) => p !== socket);

				if (room.players.length === 0) {
					// Delete room if empty
					rooms.delete(roomId);
				} else {
					// Notify remaining player
					room.players[0].send(
						JSON.stringify({
							type: "opponent_disconnected",
						}),
					);
				}
			}
		}
	});
});

function broadcastGameState(room) {
	const gameState = {
		type: "game_state",
		board: room.board,
		currentPlayer: room.currentPlayer,
		gameActive: room.gameActive,
	};

	room.players.forEach((player) => {
		player.send(JSON.stringify(gameState));
	});
}

function broadcastGameResult(room, result) {
	const gameResult = {
		type: "game_result",
		result: result.status,
		winner: result.winner,
		winLine: result.winLine,
	};

	room.players.forEach((player) => {
		player.send(JSON.stringify(gameResult));
	});
}

function checkGameResult(board) {
	const winPatterns = [
		[0, 1, 2],
		[3, 4, 5],
		[6, 7, 8], // rows
		[0, 3, 6],
		[1, 4, 7],
		[2, 5, 8], // columns
		[0, 4, 8],
		[2, 4, 6], // diagonals
	];

	// Check for winner
	for (const pattern of winPatterns) {
		const [a, b, c] = pattern;
		if (board[a] && board[a] === board[b] && board[a] === board[c]) {
			return {
				status: "win",
				winner: board[a],
				winLine: pattern,
			};
		}
	}

	// Check for draw
	if (board.every((cell) => cell)) {
		return {
			status: "draw",
		};
	}

	// Game still active
	return {
		status: "active",
	};
}

function generateRoomId() {
	// Generate a 6-character alphanumeric room ID
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	let id = "";
	for (let i = 0; i < 6; i++) {
		id += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return id;
}

console.log("WebSocket server running on port 3000");

// Game state variables
let socket;
let gameState = {
	board: Array(9).fill(""),
	currentPlayer: "X",
	mySymbol: null,
	roomId: null,
	gameActive: true,
};

// DOM Elements
const connectBtn = document.getElementById("connectBtn");
const createRoomBtn = document.getElementById("createRoomBtn");
const refreshRoomsBtn = document.getElementById("refreshRoomsBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const resetBtn = document.getElementById("resetBtn");
const leaveRoomBtn = document.getElementById("leaveRoomBtn");
const serverAddressInput = document.getElementById("serverAddress");
const roomIdInput = document.getElementById("roomIdInput");
const roomList = document.getElementById("roomList");
const currentRoomIdSpan = document.getElementById("currentRoomId");
const playerSymbolSpan = document.getElementById("playerSymbol");
const statusDisplay = document.getElementById("status");
const board = document.getElementById("board");

// Section elements
const connectionSection = document.getElementById("connectionSection");
const roomSection = document.getElementById("roomSection");
const gameSection = document.getElementById("gameSection");

// Event listeners
connectBtn.addEventListener("click", connectToServer);
createRoomBtn.addEventListener("click", createRoom);
refreshRoomsBtn.addEventListener("click", refreshRooms);
joinRoomBtn.addEventListener("click", joinRoomById);
resetBtn.addEventListener("click", resetGame);
leaveRoomBtn.addEventListener("click", leaveRoom);
board.addEventListener("click", handleCellClick);

// Connect to the WebSocket server
function connectToServer() {
	const serverAddress = serverAddressInput.value.trim();
	if (!serverAddress) {
		showStatus("Please enter a server address", true);
		return;
	}

	try {
		socket = new WebSocket(`ws://${serverAddress}`);

		socket.onopen = () => {
			showStatus("Connected to server");
			showSection("roomSection");
			refreshRooms();
		};

		socket.onmessage = (event) => {
			handleServerMessage(JSON.parse(event.data));
		};

		socket.onclose = () => {
			showStatus("Disconnected from server", true);
			showSection("connectionSection");
			resetGameState();
		};

		socket.onerror = (error) => {
			showStatus("Connection error", true);
			console.error("WebSocket error:", error);
		};
	} catch (error) {
		showStatus("Invalid server address", true);
		console.error("Connection error:", error);
	}
}

// Create a new game room
function createRoom() {
	if (!isSocketReady()) return;

	socket.send(
		JSON.stringify({
			type: "create_room",
		}),
	);
}

// Refresh the list of available rooms
function refreshRooms() {
	if (!isSocketReady()) return;

	socket.send(
		JSON.stringify({
			type: "list_rooms",
		}),
	);
}

// Join a room by its ID
function joinRoomById() {
	if (!isSocketReady()) return;

	const roomId = roomIdInput.value.trim();
	if (!roomId) {
		showStatus("Please enter a room ID", true);
		return;
	}

	joinRoom(roomId);
}

// Join a specific room
function joinRoom(roomId) {
	if (!isSocketReady()) return;

	socket.send(
		JSON.stringify({
			type: "join_room",
			roomId: roomId,
		}),
	);
}

// Handle a cell click on the game board
function handleCellClick(event) {
	if (!isSocketReady() || !gameState.gameActive) return;

	const cell = event.target;
	if (!cell.classList.contains("cell")) return;

	const index = parseInt(cell.dataset.index);

	// Check if the move is valid
	if (
		gameState.board[index] ||
		gameState.currentPlayer !== gameState.mySymbol
	) {
		return;
	}

	// Send the move to the server
	socket.send(
		JSON.stringify({
			type: "move",
			index: index,
		}),
	);
}

// Reset the current game
function resetGame() {
	if (!isSocketReady() || !gameState.roomId) return;

	socket.send(
		JSON.stringify({
			type: "reset_game",
		}),
	);
}

// Leave the current room
function leaveRoom() {
	if (socket && socket.readyState === WebSocket.OPEN) {
		socket.close();
	}
}

// Handle messages from the server
function handleServerMessage(data) {
	switch (data.type) {
		case "error":
			showStatus(data.message, true);
			break;

		case "room_list":
			updateRoomList(data.rooms);
			break;

		case "room_created":
			gameState.roomId = data.roomId;
			gameState.mySymbol = data.symbol;
			currentRoomIdSpan.textContent = data.roomId;
			playerSymbolSpan.textContent = data.symbol;
			showSection("gameSection");
			showStatus("Room created. Waiting for opponent...");
			break;

		case "room_joined":
			gameState.roomId = data.roomId;
			gameState.mySymbol = data.symbol;
			currentRoomIdSpan.textContent = data.roomId;
			playerSymbolSpan.textContent = data.symbol;
			showSection("gameSection");
			showStatus("Joined room. Game starting...");
			break;

		case "opponent_joined":
			showStatus("Opponent joined. Your turn!");
			resetBtn.disabled = false;
			break;

		case "opponent_disconnected":
			showStatus("Opponent disconnected");
			disableBoard();
			resetBtn.disabled = true;
			break;

		case "game_state":
			updateGameState(data);
			break;

		case "game_result":
			handleGameResult(data);
			break;
	}
}

// Update the list of available rooms
function updateRoomList(rooms) {
	roomList.innerHTML = "";

	if (rooms.length === 0) {
		const emptyItem = document.createElement("div");
		emptyItem.className = "room-item";
		emptyItem.textContent = "No rooms available";
		roomList.appendChild(emptyItem);
		return;
	}

	rooms.forEach((room) => {
		const roomItem = document.createElement("div");
		roomItem.className = "room-item";
		roomItem.textContent = `Room: ${room.id}`;
		roomItem.addEventListener("click", () => joinRoom(room.id));
		roomList.appendChild(roomItem);
	});
}

// Update the game state
function updateGameState(data) {
	gameState.board = data.board;
	gameState.currentPlayer = data.currentPlayer;
	gameState.gameActive = data.gameActive;

	renderBoard();

	if (gameState.gameActive) {
		const isMyTurn = gameState.currentPlayer === gameState.mySymbol;
		showStatus(isMyTurn ? "Your turn" : "Opponent's turn");
	}
}

// Handle game result
function handleGameResult(data) {
	gameState.gameActive = false;

	if (data.result === "win") {
		const isWinner = data.winner === gameState.mySymbol;
		showStatus(isWinner ? "You win!" : "You lose!");

		// Highlight winning cells
		if (data.winLine) {
			data.winLine.forEach((index) => {
				const cell = document.querySelector(`.cell[data-index="${index}"]`);
				if (cell) cell.classList.add("win");
			});
		}
	} else if (data.result === "draw") {
		showStatus("It's a draw!");
	}

	resetBtn.disabled = false;
}

// Render the game board based on current state
function renderBoard() {
	const cells = document.getElementsByClassName("cell");

	for (let i = 0; i < cells.length; i++) {
		cells[i].textContent = gameState.board[i];
		cells[i].classList.remove("win");

		if (!gameState.gameActive || gameState.board[i]) {
			cells[i].classList.add("disabled");
		} else {
			cells[i].classList.remove("disabled");
		}
	}
}

// Disable the game board
function disableBoard() {
	gameState.gameActive = false;
	renderBoard();
}

// Reset the game state
function resetGameState() {
	gameState = {
		board: Array(9).fill(""),
		currentPlayer: "X",
		mySymbol: null,
		roomId: null,
		gameActive: true,
	};
}

// Show status message
function showStatus(message, isError = false) {
	statusDisplay.textContent = message;
	statusDisplay.style.color = isError ? "red" : "black";
}

// Show a specific section and hide others
function showSection(sectionId) {
	connectionSection.classList.add("hidden");
	roomSection.classList.add("hidden");
	gameSection.classList.add("hidden");

	document.getElementById(sectionId).classList.remove("hidden");
}

// Check if the socket is ready
function isSocketReady() {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		showStatus("Not connected to server", true);
		showSection("connectionSection");
		return false;
	}
	return true;
}

// Initialize
function initialize() {
	renderBoard();
}

initialize();

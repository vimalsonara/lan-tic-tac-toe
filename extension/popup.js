let socket;
let gameState = {
	board: Array(9).fill(""),
	currentPlayer: "X",
	mySymbol: null,
};

document.getElementById("connect").addEventListener("click", () => {
	const serverAddress = document.getElementById("serverAddress").value;
	connectToServer(serverAddress);
});

function connectToServer(address) {
	socket = new WebSocket(`ws://${address}`);

	socket.onopen = () => {
		document.getElementById("status").textContent =
			"Connected! Waiting for opponent...";
	};

	socket.onmessage = (event) => {
		const data = JSON.parse(event.data);

		switch (data.type) {
			case "init":
				gameState.mySymbol = data.symbol;
				document.getElementById("status").textContent =
					`You are ${data.symbol}`;
				break;

			case "move":
				updateBoard(data.index, data.symbol);
				break;

			case "gameState":
				gameState.board = data.board;
				gameState.currentPlayer = data.currentPlayer;
				renderBoard();
				break;
		}
	};

	socket.onclose = () => {
		document.getElementById("status").textContent = "Disconnected";
	};
}

document.getElementById("board").addEventListener("click", (e) => {
	if (!socket || socket.readyState !== WebSocket.OPEN) return;

	const cell = e.target;
	if (!cell.classList.contains("cell")) return;

	const index = cell.dataset.index;
	if (gameState.board[index] || gameState.currentPlayer !== gameState.mySymbol)
		return;

	socket.send(
		JSON.stringify({
			type: "move",
			index: index,
		}),
	);
});

function updateBoard(index, symbol) {
	gameState.board[index] = symbol;
	gameState.currentPlayer = symbol === "X" ? "O" : "X";
	renderBoard();
	checkWinner();
}

function renderBoard() {
	const cells = document.getElementsByClassName("cell");
	for (let i = 0; i < cells.length; i++) {
		cells[i].textContent = gameState.board[i];
	}
}

function checkWinner() {
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

	for (const pattern of winPatterns) {
		const [a, b, c] = pattern;
		if (
			gameState.board[a] &&
			gameState.board[a] === gameState.board[b] &&
			gameState.board[a] === gameState.board[c]
		) {
			document.getElementById("status").textContent =
				`Player ${gameState.board[a]} wins!`;
			return;
		}
	}

	if (gameState.board.every((cell) => cell)) {
		document.getElementById("status").textContent = "It's a draw!";
	}
}

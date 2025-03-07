# Tic-Tac-Toe LAN Game

A multiplayer Tic-Tac-Toe game that allows players to play against each other over a local area network (LAN) using a Chrome extension and WebSocket server.

## Features

- Create and join game rooms
- Play Tic-Tac-Toe with friends on the same network
- Multiple simultaneous game rooms
- Real-time gameplay with WebSocket communication
- Win detection and game state management
- Reset game functionality
- Clean and intuitive user interface

## Requirements

- [Node.js](https://nodejs.org/) (v18 or higher)
- Google Chrome browser
- Local network connection between players

## Installation

### 1. Set up the WebSocket Server

1. Clone this repository:

   ```bash
   git clone git@github.com:vimalsonara/lan-tic-tac-toe.git
   cd tic-tac-toe-lan-game
   ```

2. Install the required dependencies:

   ```bash
   cd server
   npm install
   ```

3. Start the server:

   ```bash
   node server.js
   ```

4. Note your computer's IP address on the local network:
   - Windows: Open Command Prompt and type `ipconfig`
   - Mac/Linux: Open Terminal and type `ifconfig` or `ip addr`
   - Look for the IPv4 address (usually starts with 192.168.x.x)

### 2. Install the Chrome Extension

1. Open Google Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" by toggling the switch in the top right corner
3. Click the "Load unpacked" button
4. Select the `extension` folder from this repository
5. The Tic-Tac-Toe extension should now appear in your extensions list

## How to Play

### For the Host Player

1. Click the extension icon in Chrome's toolbar to open the game
2. Enter your server's IP address and port (e.g., `192.168.1.100:3000`) and click "Connect"
3. Click "Create Room" to start a new game room
4. Share the displayed Room ID with your friend

### For the Joining Player

1. Click the extension icon in Chrome's toolbar to open the game
2. Enter the same server IP address and port as the host and click "Connect"
3. Either:
   - Click on an available room in the list, or
   - Enter the Room ID provided by the host and click "Join"

### Playing the Game

- Players take turns placing their symbol (X or O) on the board
- The first player to get three of their symbols in a row (horizontally, vertically, or diagonally) wins
- If all cells are filled without a winner, the game ends in a draw
- Click the "Reset Game" button to play again without leaving the room
- Click "Leave Room" to exit the current game

## Development

### Project Structure

```
tic-tac-toe-lan-game/
├── server/               # Server code directory
│   ├── server.js         # WebSocket server implementation
│   └── package.json      # Server dependencies
│
├── extension/            # Extension code directory
│   ├── manifest.json     # Chrome extension manifest
│   ├── popup.html        # Extension UI
│   ├── popup.js          # Extension logic
│   └── icons/            # Extension icons
│
├── LICENSE               # MIT License
└── README.md             # This file
```

### Customization

Feel free to modify the code to add features or change the game's appearance:

- Adjust the UI styling in `extension/popup.html`
- Modify game logic in `extension/popup.js` and `server/server.js`
- Add sound effects, animations, or other enhancements

## Troubleshooting

- **Connection Issues**: Make sure the server is running and the IP address/port are correct
- **Chrome Extension Not Loading**: Verify that Developer mode is enabled and the extension is properly loaded
- **Game Not Starting**: Ensure both players are connected to the same server
- **Port Blocked**: Check if port 3000 is blocked by your firewall or network settings

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- Built with [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- Developed as a learning project for real-time network gaming

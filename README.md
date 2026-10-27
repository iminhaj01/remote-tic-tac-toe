# Remote Tic-Tac-Toe

A real-time two-player Tic-Tac-Toe game. Players can use separate phones, tablets, or computers and join the same room with a short code.

## Rules
- Two players per room: X and O.
- X moves first; players alternate turns.
- Select an empty square to place your mark.
- First player to get three marks in a row, column, or diagonal wins.
- If the board fills and nobody has three in a row, the game is a draw.
- Create a new round after a result.

## Run locally
Requirements: Node.js 18 or newer.

```bash
npm install
npm start
```

Open http://localhost:3000 on your computer. For testing on the same Wi-Fi, open `http://YOUR_COMPUTER_LAN_IP:3000` on another device. For people in different locations, deploy the app publicly (instructions below).

## Deploy publicly on Render
1. Create a GitHub account if you do not have one, then create a new repository named `remote-tic-tac-toe`.
2. Upload the contents of this project folder to that repository (the files should be at the repository root).
3. Sign in to Render and choose **New + → Web Service**.
4. Connect your GitHub repository.
5. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
6. Choose a plan available to your account and click **Deploy Web Service**.
7. Wait for the deploy to finish, then open the `https://...onrender.com` URL Render provides. Send that URL to both players.
8. Player 1 clicks **Create a room** and shares the room code. Player 2 opens the same URL, enters the code, and clicks **Join room**.

Socket.IO uses the same public web service, so the app does not need a separate database for this simple game.

## Important limitations
- Rooms and game state live in server memory. Restarting/redeploying the server clears active games.
- This starter project is designed for a single server instance. Do not enable multiple instances without adding shared state (for example, Redis).
- A room is ephemeral and intended for casual play, not competitive or high-stakes use.

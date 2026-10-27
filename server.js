const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT || 3000;
const rooms = new Map();

app.use(express.static(path.join(__dirname, "public")));
app.get("/health", (_req, res) => res.json({ ok: true }));

function cleanRoomCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
}
function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code;
  do {
    code = Array.from({length: 5}, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}
function freshRoom(code) {
  return { code, players: [], board: Array(9).fill(null), turn: "X", winner: null, status: "waiting" };
}
function publicState(room) {
  return {
    code: room.code,
    players: room.players.map(p => ({ mark: p.mark, name: p.name })),
    board: room.board,
    turn: room.turn,
    winner: room.winner,
    status: room.status
  };
}
function broadcast(room) {
  io.to(room.code).emit("state", publicState(room));
}
function winnerOf(board) {
  const lines = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  for (const [a,b,c] of lines) if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
  return board.every(Boolean) ? "draw" : null;
}
function leaveCurrentRoom(socket) {
  const code = socket.data.roomCode;
  if (!code) return;
  const room = rooms.get(code);
  socket.leave(code);
  socket.data.roomCode = null;
  if (!room) return;
  room.players = room.players.filter(p => p.id !== socket.id);
  if (room.players.length === 0) {
    rooms.delete(code);
  } else {
    room.status = "waiting";
    room.board = Array(9).fill(null);
    room.turn = "X";
    room.winner = null;
    broadcast(room);
  }
}

io.on("connection", socket => {
  socket.on("create-room", ({name} = {}) => {
    leaveCurrentRoom(socket);
    const code = makeCode();
    const room = freshRoom(code);
    room.players.push({ id: socket.id, mark: "X", name: String(name || "Player 1").trim().slice(0, 20) || "Player 1" });
    rooms.set(code, room);
    socket.join(code);
    socket.data.roomCode = code;
    socket.emit("joined", { code, mark: "X" });
    broadcast(room);
  });

  socket.on("join-room", ({code, name} = {}) => {
    const clean = cleanRoomCode(code);
    const room = rooms.get(clean);
    if (!room) return socket.emit("error-message", "Room not found. Check the code or create a new room.");
    if (room.players.length >= 2) return socket.emit("error-message", "This room already has two players.");
    if (room.players.some(p => p.id === socket.id)) return;
    leaveCurrentRoom(socket);
    const mark = "O";
    room.players.push({ id: socket.id, mark, name: String(name || "Player 2").trim().slice(0, 20) || "Player 2" });
    room.status = "playing";
    socket.join(clean);
    socket.data.roomCode = clean;
    socket.emit("joined", { code: clean, mark });
    broadcast(room);
  });

  socket.on("move", ({index} = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.status !== "playing" || room.winner || !Number.isInteger(index) || index < 0 || index > 8) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player || player.mark !== room.turn || room.board[index] !== null) return;
    room.board[index] = player.mark;
    room.winner = winnerOf(room.board);
    room.turn = room.turn === "X" ? "O" : "X";
    broadcast(room);
  });

  socket.on("play-again", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.players.length !== 2) return;
    room.board = Array(9).fill(null);
    room.turn = "X";
    room.winner = null;
    room.status = "playing";
    broadcast(room);
  });

  socket.on("disconnect", () => leaveCurrentRoom(socket));
});

server.listen(PORT, "0.0.0.0", () => console.log(`Game server listening on ${PORT}`));
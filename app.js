const socket = io();
const $ = id => document.getElementById(id);
const lobby = $("lobby"), game = $("game"), message = $("message");
let myMark = null, roomCode = null, latestState = null;

function playerName() { return $("playerName").value.trim().slice(0,20) || "Player"; }
function showMessage(text) { message.textContent = text || ""; }
function showGame() { lobby.classList.add("hidden"); game.classList.remove("hidden"); }
function showLobby() { game.classList.add("hidden"); lobby.classList.remove("hidden"); myMark = null; roomCode = null; latestState = null; showMessage(""); }

$("createBtn").addEventListener("click", () => { showMessage(""); socket.emit("create-room", {name: playerName()}); });
$("joinBtn").addEventListener("click", () => {
  showMessage("");
  const code = $("roomCode").value.trim().toUpperCase();
  if (!code) return showMessage("Enter your friend's room code first.");
  socket.emit("join-room", {code, name: playerName()});
});
$("roomCode").addEventListener("input", e => e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,6));
$("copyBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(roomCode); $("copyBtn").textContent = "Copied!"; setTimeout(() => $("copyBtn").textContent = "Copy code", 1300); }
  catch { showMessage("Your room code is " + roomCode + " — copy it manually."); }
});
$("leaveBtn").addEventListener("click", () => { socket.disconnect(); showLobby(); socket.connect(); });
$("againBtn").addEventListener("click", () => socket.emit("play-again"));
document.querySelectorAll(".cell").forEach(cell => cell.addEventListener("click", () => {
  if (!latestState || latestState.status !== "playing" || latestState.winner || latestState.turn !== myMark) return;
  socket.emit("move", {index: Number(cell.dataset.index)});
}));
socket.on("joined", data => { roomCode = data.code; myMark = data.mark; $("codeLabel").textContent = roomCode; showGame(); showMessage(""); });
socket.on("error-message", showMessage);
socket.on("connect_error", () => showMessage("Connection problem. Refresh the page and try again."));
socket.on("state", state => {
  latestState = state;
  $("nameX").textContent = state.players.find(p => p.mark === "X")?.name || "Player X";
  $("nameO").textContent = state.players.find(p => p.mark === "O")?.name || "Waiting…";
  $("playerX").classList.toggle("active", state.turn === "X" && !state.winner && state.status === "playing");
  $("playerO").classList.toggle("active", state.turn === "O" && !state.winner && state.status === "playing");
  document.querySelectorAll(".cell").forEach((cell, i) => {
    const mark = state.board[i];
    cell.textContent = mark || "";
    cell.classList.toggle("x", mark === "X");
    cell.classList.toggle("o", mark === "O");
    cell.disabled = Boolean(mark) || state.status !== "playing" || Boolean(state.winner) || state.turn !== myMark;
  });
  const again = $("againBtn");
  again.classList.toggle("hidden", !state.winner);
  if (state.status === "waiting") $("status").textContent = "Waiting for another player to join… Share the room code!";
  else if (state.winner === "draw") $("status").textContent = "It's a draw! Nice game.";
  else if (state.winner) $("status").textContent = state.winner === myMark ? "You won! 🎉" : `${state.winner} wins this round.`;
  else $("status").textContent = state.turn === myMark ? "Your turn — make your move." : `${state.turn === "X" ? $("nameX").textContent : $("nameO").textContent}'s turn…`;
});
socket.on("disconnect", () => { if (!game.classList.contains("hidden")) showMessage("Disconnected. Reconnect or refresh the page."); });
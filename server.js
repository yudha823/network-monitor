const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ping = require("ping");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // biar bisa diakses dari frontend (Netlify, Postman, dll)
  },
});

// daftar target IP/host
const targets = ["8.8.8.8", "google.com", "cloudflare.com"];

// API endpoint untuk cek daftar target
app.get("/api/targets", (req, res) => {
  res.json({ targets });
});

// interval ping 5 detik
setInterval(() => {
  targets.forEach(async (target) => {
    try {
      const result = await ping.promise.probe(target);
      io.emit("pingResult", {
        host: target,
        alive: result.alive,
        time: result.time,
        timestamp: Date.now(),
      });
    } catch (error) {
      io.emit("pingResult", {
        host: target,
        alive: false,
        time: null,
        error: error.message,
        timestamp: Date.now(),
      });
    }
  });
}, 5000);

// socket.io untuk client yang connect
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("targets", targets);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

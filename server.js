const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const ping = require("ping");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // boleh diakses dari Netlify
    methods: ["GET", "POST"]
  }
});

// Daftar target
const targets = ["8.8.8.8", "google.com", "cloudflare.com"];

// API untuk ambil daftar target
app.get("/api/targets", (req, res) => {
  res.json({ targets });
});

// Socket.io connection
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("targets", targets);
});

// Fungsi ping berkala
setInterval(async () => {
  const batch = [];
  for (const target of targets) {
    try {
      const res = await ping.promise.probe(target, { timeout: 2 });
      batch.push({
        target,
        alive: res.alive,
        time: res.time === "unknown" ? null : parseFloat(res.time),
        timestamp: Date.now()
      });
    } catch (err) {
      batch.push({
        target,
        alive: false,
        time: null,
        timestamp: Date.now()
      });
    }
  }
  io.emit("ping-batch", batch); // broadcast ke semua client
}, 5000); // setiap 5 detik

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

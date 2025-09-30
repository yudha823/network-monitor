const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ping = require("ping");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// aktifkan CORS untuk semua origin atau spesifik Netlify
app.use(cors({
  origin: [
    "https://dainty-seahorse-32a592.netlify.app", // domain frontend kamu di Netlify
    "http://localhost:5173", // opsional untuk testing lokal (vite/react)
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

// buat socket.io server dengan cors juga
const io = new Server(server, {
  cors: {
    origin: [
      "https://dainty-seahorse-32a592.netlify.app",
      "http://localhost:5173"
    ],
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// daftar target yang akan dipantau
const targets = ["8.8.8.8", "google.com", "cloudflare.com"];

// endpoint API
app.get("/api/targets", (req, res) => {
  res.json({ targets });
});

// ping setiap 5 detik
setInterval(async () => {
  const batch = [];
  for (const target of targets) {
    try {
      const res = await ping.promise.probe(target);
      batch.push({
        target,
        alive: res.alive,
        time: res.alive ? res.time : null,
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
  io.emit("ping-batch", batch);
}, 5000);

// kirim daftar target saat client connect
io.on("connection", (socket) => {
  console.log("Client connected");
  socket.emit("targets", targets);

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const ping = require("ping");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;

// daftar target yang akan dipantau
const targets = ["8.8.8.8", "google.com", "cloudflare.com"];

// simpan hasil ping terakhir
let latestBatch = [];

// endpoint root untuk tes backend
app.get("/", (req, res) => {
  res.send("Backend is running 🚀 Use /api/targets or /api/status for data");
});

// endpoint API (buat fallback frontend)
app.get("/api/targets", (req, res) => {
  res.json({ targets });
});

// endpoint API untuk status terakhir
app.get("/api/status", (req, res) => {
  res.json({ status: latestBatch });
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

  // simpan batch terbaru
  latestBatch = batch;

  // broadcast ke semua client via socket.io
  io.emit("ping-batch", batch);
}, 5000);

// kirim daftar target saat client connect
io.on("connection", (socket) => {
  socket.emit("targets", targets);
});

// mulai server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

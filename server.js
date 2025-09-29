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

// endpoint API (buat fallback)
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
  socket.emit("targets", targets);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// server.js
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

// List target yang dipantau
const targets = ["google.com", "cloudflare.com", "bing.com", "yahoo.com"];

// Penyimpanan hasil ping
let results = {};

// Inisialisasi data kosong
targets.forEach(t => {
  results[t] = [];
});

// Fungsi untuk melakukan "ping" berbasis HTTP request
async function httpPing(target) {
  try {
    const start = Date.now();
    // Coba request HTTPS
    await axios.get("https://" + target, { timeout: 3000 });
    const end = Date.now();

    return {
      target,
      alive: true,
      time: end - start,
      timestamp: Date.now()
    };
  } catch (err) {
    return {
      target,
      alive: false,
      time: null,
      timestamp: Date.now()
    };
  }
}

// Looping ping tiap 5 detik
setInterval(async () => {
  for (const target of targets) {
    const result = await httpPing(target);
    results[target].push(result);

    // Batasi hanya simpan 200 data terakhir
    if (results[target].length > 200) {
      results[target].shift();
    }
  }
}, 5000);

// API untuk ambil data ping
app.get("/api/ping", (req, res) => {
  const target = req.query.target;
  if (!target || !results[target]) {
    return res.status(400).json({ error: "Target tidak valid" });
  }
  res.json(results[target]);
});

// API untuk ambil status singkat semua target
app.get("/api/status", (req, res) => {
  const status = targets.map(t => {
    const last = results[t][results[t].length - 1];
    return {
      target: t,
      last: last ? new Date(last.timestamp).toLocaleTimeString() : "-",
      alive: last ? (last.alive ? "Up" : "Down") : "-",
      latency: last && last.time !== null ? last.time : "-"
    };
  });
  res.json(status);
});

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});

// FAST X AI TRADING - BACKEND + ADMIN PANEL WITH HOMEPAGE MESSAGE

const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

let adminPassword = "fastxadmin123";
let users = [];
let withdrawals = [];

app.get("/", (req, res) => {
  res.send("✅ FAST X AI Backend is LIVE — Use /api/roi/:wallet or /api/admin endpoints");
});

app.post("/api/deposit", (req, res) => {
  const { wallet, plan, amount, txHash } = req.body;
  users.push({ wallet, plan, deposit: amount, txHash, roiStart: new Date() });
  res.json({ message: "Deposit received and recorded." });
});

app.get("/api/roi/:wallet", (req, res) => {
  const wallet = req.params.wallet;
  const user = users.find((u) => u.wallet === wallet);
  if (!user) return res.status(404).json({ message: "User not found." });

  const days = Math.floor((new Date() - new Date(user.roiStart)) / (1000 * 60 * 60 * 24));
  const roiRate = { Basic: 0.03, Silver: 0.04, Gold: 0.05, Diamond: 0.1 }[user.plan] || 0;
  const totalROI = user.deposit * roiRate * days;
  res.json({ totalROI, days, plan: user.plan });
});

app.post("/api/withdraw", (req, res) => {
  const { wallet, amount } = req.body;
  withdrawals.push({ wallet, amount, status: "pending" });
  res.json({ message: "Withdrawal requested. Pending admin approval." });
});

app.get("/api/admin/users", (req, res) => {
  res.json(users);
});

app.get("/api/admin/withdrawals", (req, res) => {
  res.json(withdrawals);
});

app.post("/api/admin/approve", (req, res) => {
  const { wallet, password } = req.body;
  if (password !== adminPassword) return res.status(403).json({ message: "Unauthorized" });
  const withdrawal = withdrawals.find(w => w.wallet === wallet && w.status === "pending");
  if (!withdrawal) return res.status(404).json({ message: "Request not found." });
  withdrawal.status = "approved";
  res.json({ message: "Withdrawal approved." });
});

app.post("/api/admin/reject", (req, res) => {
  const { wallet, password } = req.body;
  if (password !== adminPassword) return res.status(403).json({ message: "Unauthorized" });
  const withdrawal = withdrawals.find(w => w.wallet === wallet && w.status === "pending");
  if (!withdrawal) return res.status(404).json({ message: "Request not found." });
  withdrawal.status = "rejected";
  res.json({ message: "Withdrawal rejected." });
});

app.post("/api/admin/change-password", (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (oldPassword !== adminPassword) return res.status(403).json({ message: "Incorrect old password" });
  adminPassword = newPassword;
  res.json({ message: "Admin password changed successfully" });
});

app.get("/api/admin/export", (req, res) => {
  const csv = withdrawals.map(w => `${w.wallet},${w.amount},${w.status}`).join("\n");
  res.header("Content-Type", "text/csv");
  res.attachment("withdrawals.csv");
  res.send("Wallet,Amount,Status\n" + csv);
});

app.get("/api/admin/stats", (req, res) => {
  const totalUsers = users.length;
  const totalWithdrawals = withdrawals.length;
  const approved = withdrawals.filter(w => w.status === "approved").length;
  const pending = withdrawals.filter(w => w.status === "pending").length;
  const rejected = withdrawals.filter(w => w.status === "rejected").length;
  res.json({ totalUsers, totalWithdrawals, approved, pending, rejected });
});

app.listen(port, () => {
  console.log(`FAST X backend running on http://localhost:${port}`);
});

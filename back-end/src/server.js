import express from "express";
import cors from "cors";
import "dotenv/config";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import usersRoutes, { outboxRouter } from "./routes/users.js";
import leavesRoutes from "./routes/leaves.js";
import departmentsRoutes from "./routes/departments.js";
import leaveTypesRoutes from "./routes/leaveTypes.js";

const app = express();
app.use(cors({ origin: ["http://localhost:5173"] }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const [rows] = await pool.query("SELECT 1 AS ok");
  res.json({ status: "ok", db: rows[0].ok === 1 });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/outbox", outboxRouter);
app.use("/api/leaves", leavesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/leave-types", leaveTypesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

app.listen(process.env.PORT, () => console.log(`API running on http://localhost:${process.env.PORT}`));
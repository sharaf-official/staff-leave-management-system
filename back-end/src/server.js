import express from "express";
import cors from "cors";
import helmet from "helmet";
import "dotenv/config";
import { pool } from "./db.js";
import authRoutes from "./routes/auth.js";
import usersRoutes, { outboxRouter } from "./routes/users.js";
import leavesRoutes from "./routes/leaves.js";
import departmentsRoutes from "./routes/departments.js";
import leaveTypesRoutes from "./routes/leaveTypes.js";
import notificationsRoutes from "./routes/notifications.js";
import companyRoutes from "./routes/company.js";
import announcementsRoutes from "./routes/announcements.js";
import holidaysRoutes from "./routes/holidays.js";
const app = express();
app.set("trust proxy", 1);
app.set("trust proxy", 1);

app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://leavenest.sharafizam.com"
  ]
}));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  try {
    const [rows] = await pool.query("SELECT 1 AS ok");
    res.json({ status: "ok", db: rows[0].ok === 1 });
  } catch (err) {
    console.error("DB check failed:", err.message);
    res.status(503).json({ status: "error", db: false, message: err.code || err.message });
  }
});

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/outbox", outboxRouter);
app.use("/api/leaves", leavesRoutes);
app.use("/api/departments", departmentsRoutes);
app.use("/api/leave-types", leaveTypesRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/announcements", announcementsRoutes);
app.use("/api/holidays", holidaysRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Server error." });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`API running on port ${PORT}`);
});
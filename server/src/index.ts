import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import gamificationRoutes from "./routes/gamification";

import leaderboardRoutes from "./routes/leaderboard";
import challengesRoutes from "./routes/challenges";
import friendsRoutes from "./routes/friends";

app.use("/api/auth", authRoutes);
app.use("/api/gamification", gamificationRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/challenges", challengesRoutes);
app.use("/api/friends", friendsRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

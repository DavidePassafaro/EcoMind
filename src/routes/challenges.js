"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma_1 = __importDefault(require("../prisma"));
const router = (0, express_1.Router)();
router.use(auth_middleware_1.authenticateToken);
// Get available daily challenges (mocking active ones, since it's an admin pool)
router.get('/', async (req, res) => {
    try {
        // In a real app, you might pick 3 random or specific challenges per day
        // Here we just return 5 challenges from the DB
        const challenges = await prisma_1.default.challenge.findMany({
            take: 5,
            orderBy: { id: 'desc' }
        });
        res.json(challenges);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch challenges' });
    }
});
// Accept a challenge (standard or custom from frontend)
router.post('/accept', async (req, res) => {
    try {
        const userId = req.user.id;
        const { challengeId, title, description, points } = req.body;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let targetChallengeId = challengeId;
        // If it's a custom challenge from frontend, create it first
        if (!targetChallengeId && title) {
            const newChallenge = await prisma_1.default.challenge.create({
                data: {
                    title,
                    description,
                    points: points || 10,
                    source: 'frontend' // Marks it as user-created so it joins the pool
                }
            });
            targetChallengeId = newChallenge.id;
        }
        if (!targetChallengeId) {
            return res.status(400).json({ error: 'Provide challengeId or title for custom challenge' });
        }
        // Check if already accepted today
        const existing = await prisma_1.default.userChallenge.findUnique({
            where: {
                userId_challengeId_date: {
                    userId,
                    challengeId: targetChallengeId,
                    date: today
                }
            }
        });
        if (existing) {
            return res.status(400).json({ error: 'Challenge already accepted or completed today' });
        }
        const userChallenge = await prisma_1.default.userChallenge.create({
            data: {
                userId,
                challengeId: targetChallengeId,
                date: today,
                status: 'accepted'
            }
        });
        res.status(201).json(userChallenge);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to accept challenge' });
    }
});
// Complete a challenge
router.post('/:id/complete', async (req, res) => {
    try {
        const userChallengeId = parseInt(req.params.id);
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const userChallenge = await prisma_1.default.userChallenge.findUnique({
            where: { id: userChallengeId },
            include: { challenge: true }
        });
        if (!userChallenge || userChallenge.userId !== userId) {
            return res.status(404).json({ error: 'User challenge not found' });
        }
        if (userChallenge.status === 'completed') {
            return res.status(400).json({ error: 'Challenge already completed' });
        }
        // Update challenge to completed and update daily score transactionally
        await prisma_1.default.$transaction(async (tx) => {
            await tx.userChallenge.update({
                where: { id: userChallengeId },
                data: { status: 'completed' }
            });
            // Update or create daily score
            const dailyScore = await tx.dailyScore.findUnique({
                where: { userId_date: { userId, date: today } }
            });
            if (dailyScore) {
                await tx.dailyScore.update({
                    where: { id: dailyScore.id },
                    data: { score: dailyScore.score + userChallenge.challenge.points }
                });
            }
            else {
                await tx.dailyScore.create({
                    data: {
                        userId,
                        date: today,
                        score: userChallenge.challenge.points
                    }
                });
            }
        });
        res.json({ message: 'Challenge completed successfully', pointsEarned: userChallenge.challenge.points });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to complete challenge' });
    }
});
exports.default = router;
//# sourceMappingURL=challenges.js.map
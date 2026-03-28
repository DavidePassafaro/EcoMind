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
// Get Friends Leaderboard (Daily)
router.get('/friends', async (req, res) => {
    try {
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Get friends
        const friendships = await prisma_1.default.friendship.findMany({
            where: { userId },
            select: { friendId: true }
        });
        const userIds = [userId, ...friendships.map(f => f.friendId)];
        const scores = await prisma_1.default.dailyScore.findMany({
            where: {
                userId: { in: userIds },
                date: today
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { score: 'desc' }
        });
        // If a user has no score today, they have 0
        const scoredUserIds = new Set(scores.map(s => s.userId));
        // Add missing users with 0 score
        const missingUsers = await prisma_1.default.user.findMany({
            where: { id: { in: userIds.filter(id => !scoredUserIds.has(id)) } },
            select: { id: true, name: true, email: true }
        });
        const fullScores = [
            ...scores.map(s => ({ user: s.user, score: s.score })),
            ...missingUsers.map(u => ({ user: u, score: 0 }))
        ].sort((a, b) => b.score - a.score);
        const top20 = fullScores.slice(0, 20);
        const userPosition = fullScores.findIndex(s => s.user.id === userId) + 1;
        res.json({
            leaderboard: top20,
            userPosition,
            totalParticipants: fullScores.length
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch friends leaderboard' });
    }
});
// Get Group Leaderboard (Daily)
router.get('/groups/:groupId', async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const userId = req.user.id;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        // Verify membership
        const membership = await prisma_1.default.groupMember.findUnique({
            where: { groupId_userId: { groupId, userId } }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Not a member of this group' });
        }
        const members = await prisma_1.default.groupMember.findMany({
            where: { groupId },
            select: { userId: true }
        });
        const userIds = members.map(m => m.userId);
        const scores = await prisma_1.default.dailyScore.findMany({
            where: {
                userId: { in: userIds },
                date: today
            },
            include: {
                user: { select: { id: true, name: true, email: true } }
            },
            orderBy: { score: 'desc' }
        });
        const scoredUserIds = new Set(scores.map(s => s.userId));
        const missingUsers = await prisma_1.default.user.findMany({
            where: { id: { in: userIds.filter(id => !scoredUserIds.has(id)) } },
            select: { id: true, name: true, email: true }
        });
        const fullScores = [
            ...scores.map(s => ({ user: s.user, score: s.score })),
            ...missingUsers.map(u => ({ user: u, score: 0 }))
        ].sort((a, b) => b.score - a.score);
        const top20 = fullScores.slice(0, 20);
        const userPosition = fullScores.findIndex(s => s.user.id === userId) + 1;
        res.json({
            leaderboard: top20,
            userPosition,
            totalParticipants: fullScores.length
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch group leaderboard' });
    }
});
exports.default = router;
//# sourceMappingURL=leaderboard.js.map
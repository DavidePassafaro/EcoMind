"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = __importDefault(require("../prisma"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Search for users
router.get("/search", auth_middleware_1.authenticateToken, async (req, res) => {
    try {
        const { q } = req.query;
        const userId = req.user?.id;
        if (!q) {
            return res.status(400).json({ error: "Search query is required" });
        }
        if (!userId) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const searchQuery = String(q).toLowerCase();
        const users = await prisma_1.default.user.findMany({
            where: {
                AND: [
                    {
                        id: {
                            not: userId, // Exclude the current user
                        },
                    },
                    {
                        OR: [
                            {
                                name: {
                                    contains: searchQuery,
                                    mode: "insensitive",
                                },
                            },
                            {
                                email: {
                                    contains: searchQuery,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        // For each found user, check if they are already friends or if a request is pending
        const usersWithStatus = await Promise.all(users.map(async (user) => {
            const isFriend = await prisma_1.default.friendship.findFirst({
                where: {
                    OR: [
                        { userId: userId, friendId: user.id },
                        { userId: user.id, friendId: userId },
                    ],
                },
            });
            const sentRequest = await prisma_1.default.friendRequest.findFirst({
                where: {
                    senderId: userId,
                    receiverId: user.id,
                    status: "pending",
                },
            });
            const receivedRequest = await prisma_1.default.friendRequest.findFirst({
                where: {
                    senderId: user.id,
                    receiverId: userId,
                    status: "pending",
                },
            });
            let status = "none";
            if (isFriend) {
                status = "friends";
            }
            else if (sentRequest) {
                status = "request_sent";
            }
            else if (receivedRequest) {
                status = "request_received";
            }
            return { ...user, status };
        }));
        res.json(usersWithStatus);
    }
    catch (error) {
        console.error("Error searching for users:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.default = router;

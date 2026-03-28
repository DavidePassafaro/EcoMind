import { Router } from "express";
import prisma from "../prisma";
import { authenticateToken, AuthRequest } from "../middlewares/auth.middleware";

const router = Router();

// Search for users
router.get("/search", authenticateToken, async (req: AuthRequest, res) => {
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

    const users = await prisma.user.findMany({
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
    const usersWithStatus = await Promise.all(
      users.map(async (user) => {
        const isFriend = await prisma.friendship.findFirst({
          where: {
            OR: [
              { userId: userId, friendId: user.id },
              { userId: user.id, friendId: userId },
            ],
          },
        });

        const sentRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: userId,
            receiverId: user.id,
            status: "pending",
          },
        });

        const receivedRequest = await prisma.friendRequest.findFirst({
          where: {
            senderId: user.id,
            receiverId: userId,
            status: "pending",
          },
        });

        let status = "none";
        if (isFriend) {
          status = "friends";
        } else if (sentRequest) {
          status = "request_sent";
        } else if (receivedRequest) {
          status = "request_received";
        }

        return { ...user, status };
      }),
    );

    res.json(usersWithStatus);
  } catch (error) {
    console.error("Error searching for users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

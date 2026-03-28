import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

const router = Router();

router.use(authenticateToken);

router.get('/friends', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const friendships = await prisma.friendship.findMany({
      where: { userId },
      select: { friendId: true }
    });
    
    const userIds = [userId, ...friendships.map((f: any) => f.friendId)];

    const scores = await prisma.dailyScore.findMany({
      where: { userId: { in: userIds }, date: today },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { score: 'desc' }
    });

    const scoredUserIds = new Set(scores.map((s: any) => s.userId));
    
    const missingUsers = await prisma.user.findMany({
      where: { id: { in: userIds.filter((id: number) => !scoredUserIds.has(id)) } },
      select: { id: true, name: true, email: true }
    });

    const fullScores = [
      ...scores.map((s: any) => ({ user: s.user, score: s.score })),
      ...missingUsers.map((u: any) => ({ user: u, score: 0 }))
    ].sort((a, b) => b.score - a.score);

    const top20 = fullScores.slice(0, 20);
    const userPosition = fullScores.findIndex(s => s.user.id === userId) + 1;

    res.json({ leaderboard: top20, userPosition, totalParticipants: fullScores.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/groups/:groupId', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.groupId as string);
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const membership = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId, userId } }
    });

    if (!membership) return res.status(403).json({ error: 'Not a member' });

    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true }
    });
    const userIds = members.map((m: any) => m.userId);

    const scores = await prisma.dailyScore.findMany({
      where: { userId: { in: userIds }, date: today },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { score: 'desc' }
    });

    const scoredUserIds = new Set(scores.map((s: any) => s.userId));
    
    const missingUsers = await prisma.user.findMany({
      where: { id: { in: userIds.filter((id: number) => !scoredUserIds.has(id)) } },
      select: { id: true, name: true, email: true }
    });

    const fullScores = [
      ...scores.map((s: any) => ({ user: s.user, score: s.score })),
      ...missingUsers.map((u: any) => ({ user: u, score: 0 }))
    ].sort((a, b) => b.score - a.score);

    const top20 = fullScores.slice(0, 20);
    const userPosition = fullScores.findIndex(s => s.user.id === userId) + 1;

    res.json({ leaderboard: top20, userPosition, totalParticipants: fullScores.length });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
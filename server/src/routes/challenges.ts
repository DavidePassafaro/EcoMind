import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

const router = Router();

router.use(authenticateToken);

// Get available daily challenges
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const challenges = await prisma.challenge.findMany({
      take: 5,
      orderBy: { id: 'desc' }
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Accept a challenge
router.post('/accept', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { challengeId, title, description, points } = req.body;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let targetChallengeId = challengeId;

    if (!targetChallengeId && title) {
      const newChallenge = await prisma.challenge.create({
        data: {
          title,
          description,
          points: points || 10,
          source: 'frontend'
        }
      });
      targetChallengeId = newChallenge.id;
    }

    if (!targetChallengeId) {
      return res.status(400).json({ error: 'Provide challengeId or title' });
    }

    const existing = await prisma.userChallenge.findUnique({
      where: {
        userId_challengeId_date: {
          userId,
          challengeId: targetChallengeId,
          date: today
        }
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Already accepted today' });
    }

    const userChallenge = await prisma.userChallenge.create({
      data: {
        userId,
        challengeId: targetChallengeId,
        date: today,
        status: 'accepted'
      }
    });

    res.status(201).json(userChallenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to accept challenge' });
  }
});

// Complete a challenge
router.post('/:id/complete', async (req: AuthRequest, res: Response) => {
  try {
    const userChallengeId = parseInt(req.params.id as string);
    const userId = req.user!.id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userChallenge = await prisma.userChallenge.findUnique({
      where: { id: userChallengeId },
      include: { challenge: true }
    });

    if (!userChallenge || userChallenge.userId !== userId) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (userChallenge.status === 'completed') {
      return res.status(400).json({ error: 'Already completed' });
    }

    await prisma.$transaction(async (tx: any) => {
      await tx.userChallenge.update({
        where: { id: userChallengeId },
        data: { status: 'completed' }
      });

      const dailyScore = await tx.dailyScore.findUnique({
        where: { userId_date: { userId, date: today } }
      });

      if (dailyScore) {
        await tx.dailyScore.update({
          where: { id: dailyScore.id },
          data: { score: dailyScore.score + userChallenge.challenge.points }
        });
      } else {
        await tx.dailyScore.create({
          data: {
            userId,
            date: today,
            score: userChallenge.challenge.points
          }
        });
      }
    });

    res.json({ message: 'Completed', pointsEarned: userChallenge.challenge.points });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
import { Request, Response } from 'express';
import prisma from '../prisma';

export const addChallenge = async (req: Request, res: Response) => {
  const { title, description, points, source } = req.body;

  if (!title || !points) {
    return res.status(400).json({ error: 'Title and points are required' });
  }

  try {
    const newChallenge = await prisma.challenge.create({
      data: {
        title,
        description,
        points,
        source: source || 'admin', // Default to 'admin' if not provided
      },
    });
    res.status(201).json(newChallenge);
  } catch (error) {
    console.error('Error adding challenge:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

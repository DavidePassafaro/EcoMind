import { Router, Response } from 'express';
import { authenticateToken, AuthRequest } from '../middlewares/auth.middleware';
import prisma from '../prisma';

const router = Router();

router.use(authenticateToken);

router.post('/friends/request', async (req: AuthRequest, res: Response) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user!.id;
    if (senderId === receiverId) return res.status(400).json({ error: 'Self request' });

    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { userId: senderId, friendId: receiverId },
          { userId: receiverId, friendId: senderId }
        ]
      }
    });

    if (existingFriendship) return res.status(400).json({ error: 'Already friends' });

    const request = await prisma.friendRequest.create({
      data: { senderId, receiverId }
    });
    res.status(201).json(request);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/friends/requests', async (req: AuthRequest, res: Response) => {
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { receiverId: req.user!.id, status: 'pending' },
      include: { sender: { select: { id: true, name: true, email: true } } }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/friends/accept/:id', async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== req.user!.id || request.status !== 'pending') {
      return res.status(404).json({ error: 'Not found' });
    }

    await prisma.$transaction([
      prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
      prisma.friendship.create({ data: { userId: request.senderId, friendId: request.receiverId } }),
      prisma.friendship.create({ data: { userId: request.receiverId, friendId: request.senderId } })
    ]);
    res.json({ message: 'Accepted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/friends/reject/:id', async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const request = await prisma.friendRequest.findUnique({ where: { id: requestId } });
    if (!request || request.receiverId !== req.user!.id) return res.status(404).json({ error: 'Not found' });

    await prisma.friendRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
    res.json({ message: 'Rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/friends', async (req: AuthRequest, res: Response) => {
  try {
    const friendships = await prisma.friendship.findMany({
      where: { userId: req.user!.id },
      include: { friend: { select: { id: true, name: true, email: true } } }
    });
    res.json(friendships.map((f: any) => f.friend));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, type } = req.body;
    const group = await prisma.group.create({
      data: {
        name, description, type: type || 'public', adminId: req.user!.id,
        members: { create: { userId: req.user!.id } }
      }
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/groups', async (req: AuthRequest, res: Response) => {
  try {
    const groups = await prisma.groupMember.findMany({
      where: { userId: req.user!.id },
      include: { group: true }
    });
    res.json(groups.map((g: any) => g.group));
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/groups/:id/join', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.id as string);
    const userId = req.user!.id;

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ error: 'Not found' });

    const existingMember = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
    if (existingMember) return res.status(400).json({ error: 'Already member' });

    if (group.type === 'public') {
      await prisma.groupMember.create({ data: { groupId, userId } });
      return res.json({ message: 'Joined' });
    } else if (group.type === 'protected') {
      await prisma.groupJoinRequest.create({ data: { groupId, userId } });
      return res.json({ message: 'Request sent' });
    } else {
      return res.status(403).json({ error: 'Private' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.get('/groups/:id/requests', async (req: AuthRequest, res: Response) => {
  try {
    const groupId = parseInt(req.params.id as string);
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group || group.adminId !== req.user!.id) return res.status(403).json({ error: 'Not authorized' });

    const requests = await prisma.groupJoinRequest.findMany({
      where: { groupId, status: 'pending' },
      include: { user: { select: { id: true, name: true, email: true } } }
    });
    res.json(requests);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/groups/requests/:id/accept', async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const request = await prisma.groupJoinRequest.findUnique({ where: { id: requestId }, include: { group: true } });
    if (!request || request.group.adminId !== req.user!.id) return res.status(403).json({ error: 'Not auth' });

    await prisma.$transaction([
      prisma.groupJoinRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
      prisma.groupMember.create({ data: { groupId: request.groupId, userId: request.userId } })
    ]);
    res.json({ message: 'Accepted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

router.post('/groups/requests/:id/reject', async (req: AuthRequest, res: Response) => {
  try {
    const requestId = parseInt(req.params.id as string);
    const request = await prisma.groupJoinRequest.findUnique({ where: { id: requestId }, include: { group: true } });
    if (!request || request.group.adminId !== req.user!.id) return res.status(403).json({ error: 'Not auth' });

    await prisma.groupJoinRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
    res.json({ message: 'Rejected' });
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
});

export default router;
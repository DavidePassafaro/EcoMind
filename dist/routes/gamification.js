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
router.post('/friends/request', async (req, res) => {
    try {
        const { receiverId } = req.body;
        const senderId = req.user.id;
        if (senderId === receiverId)
            return res.status(400).json({ error: 'Self request' });
        const existingFriendship = await prisma_1.default.friendship.findFirst({
            where: {
                OR: [
                    { userId: senderId, friendId: receiverId },
                    { userId: receiverId, friendId: senderId }
                ]
            }
        });
        if (existingFriendship)
            return res.status(400).json({ error: 'Already friends' });
        const request = await prisma_1.default.friendRequest.create({
            data: { senderId, receiverId }
        });
        res.status(201).json(request);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/friends/requests', async (req, res) => {
    try {
        const requests = await prisma_1.default.friendRequest.findMany({
            where: { receiverId: req.user.id, status: 'pending' },
            include: { sender: { select: { id: true, name: true, email: true } } }
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/friends/accept/:id', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await prisma_1.default.friendRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== req.user.id || request.status !== 'pending') {
            return res.status(404).json({ error: 'Not found' });
        }
        await prisma_1.default.$transaction([
            prisma_1.default.friendRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
            prisma_1.default.friendship.create({ data: { userId: request.senderId, friendId: request.receiverId } }),
            prisma_1.default.friendship.create({ data: { userId: request.receiverId, friendId: request.senderId } })
        ]);
        res.json({ message: 'Accepted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/friends/reject/:id', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await prisma_1.default.friendRequest.findUnique({ where: { id: requestId } });
        if (!request || request.receiverId !== req.user.id)
            return res.status(404).json({ error: 'Not found' });
        await prisma_1.default.friendRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
        res.json({ message: 'Rejected' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/friends', async (req, res) => {
    try {
        const friendships = await prisma_1.default.friendship.findMany({
            where: { userId: req.user.id },
            include: { friend: { select: { id: true, name: true, email: true } } }
        });
        res.json(friendships.map((f) => f.friend));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/groups', async (req, res) => {
    try {
        const { name, description, type } = req.body;
        const group = await prisma_1.default.group.create({
            data: {
                name, description, type: type || 'public', adminId: req.user.id,
                members: { create: { userId: req.user.id } }
            }
        });
        res.status(201).json(group);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/groups', async (req, res) => {
    try {
        const groups = await prisma_1.default.groupMember.findMany({
            where: { userId: req.user.id },
            include: { group: true }
        });
        res.json(groups.map((g) => g.group));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/groups/:id/join', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const userId = req.user.id;
        const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
        if (!group)
            return res.status(404).json({ error: 'Not found' });
        const existingMember = await prisma_1.default.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } } });
        if (existingMember)
            return res.status(400).json({ error: 'Already member' });
        if (group.type === 'public') {
            await prisma_1.default.groupMember.create({ data: { groupId, userId } });
            return res.json({ message: 'Joined' });
        }
        else if (group.type === 'protected') {
            await prisma_1.default.groupJoinRequest.create({ data: { groupId, userId } });
            return res.json({ message: 'Request sent' });
        }
        else {
            return res.status(403).json({ error: 'Private' });
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.get('/groups/:id/requests', async (req, res) => {
    try {
        const groupId = parseInt(req.params.id);
        const group = await prisma_1.default.group.findUnique({ where: { id: groupId } });
        if (!group || group.adminId !== req.user.id)
            return res.status(403).json({ error: 'Not authorized' });
        const requests = await prisma_1.default.groupJoinRequest.findMany({
            where: { groupId, status: 'pending' },
            include: { user: { select: { id: true, name: true, email: true } } }
        });
        res.json(requests);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/groups/requests/:id/accept', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await prisma_1.default.groupJoinRequest.findUnique({ where: { id: requestId }, include: { group: true } });
        if (!request || request.group.adminId !== req.user.id)
            return res.status(403).json({ error: 'Not auth' });
        await prisma_1.default.$transaction([
            prisma_1.default.groupJoinRequest.update({ where: { id: requestId }, data: { status: 'accepted' } }),
            prisma_1.default.groupMember.create({ data: { groupId: request.groupId, userId: request.userId } })
        ]);
        res.json({ message: 'Accepted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
router.post('/groups/requests/:id/reject', async (req, res) => {
    try {
        const requestId = parseInt(req.params.id);
        const request = await prisma_1.default.groupJoinRequest.findUnique({ where: { id: requestId }, include: { group: true } });
        if (!request || request.group.adminId !== req.user.id)
            return res.status(403).json({ error: 'Not auth' });
        await prisma_1.default.groupJoinRequest.update({ where: { id: requestId }, data: { status: 'rejected' } });
        res.json({ message: 'Rejected' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});
exports.default = router;

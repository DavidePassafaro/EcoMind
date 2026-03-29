"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addChallenge = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const addChallenge = async (req, res) => {
    const { title, description, points, source } = req.body;
    if (!title || !points) {
        return res.status(400).json({ error: 'Title and points are required' });
    }
    try {
        const newChallenge = await prisma_1.default.challenge.create({
            data: {
                title,
                description,
                points,
                source: source || 'admin', // Default to 'admin' if not provided
            },
        });
        res.status(201).json(newChallenge);
    }
    catch (error) {
        console.error('Error adding challenge:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.addChallenge = addChallenge;

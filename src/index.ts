#!/usr/bin/env node

import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3059;
const CSV_FILE = path.join(path.dirname(new URL(import.meta.url).pathname), 'highScores.csv');

interface HighScore {
    score: number;
    initials: string;
}

let highScores: HighScore[] = [];

app.use(express.json());

function loadHighScores() {
    if (fs.existsSync(CSV_FILE)) {
        const data = fs.readFileSync(CSV_FILE, 'utf-8');
        highScores = data
            .split('\n')
            .filter((line) => line.trim() !== '')
            .map((line) => {
                const [score, initials] = line.split(',');
                return { score: parseInt(score, 10), initials };
            })
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }
}

function saveHighScores() {
    const data = highScores
        .map((entry) => `${entry.score},${entry.initials}`)
        .join('\n');
    fs.writeFileSync(CSV_FILE, data, 'utf-8');
}

app.post('/highScore', (req, res) => {
    const { score, initials } = req.body;

    if (
        typeof score !== 'number' ||
        typeof initials !== 'string' ||
        initials.length > 3 ||
        !/^[A-Z]+$/.test(initials)
    ) {
        return res.status(400).json({ error: 'Invalid input' });
    }

    highScores.push({ score, initials });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10);

    res.status(201).json({ message: 'High score added' });
});

app.get('/highScore', (req, res) => {
    res.json(highScores);
});

app.listen(PORT, () => {
    loadHighScores();
});

process.on('exit', saveHighScores);
process.on('SIGINT', () => {
    saveHighScores();
    process.exit();
});
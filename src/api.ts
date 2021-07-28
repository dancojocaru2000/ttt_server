import express from 'express';
import { nanoid } from 'nanoid';
import { loadDatabase, useDatabase } from './db';
import { Game } from './types/game';
import { User } from './types/user';

const router = express.Router();
export default router;

router.get('/games', async (_, res) => {
	await useDatabase(async db => {
		res.json(db.games);
	});
});

router.post('/games', async (req, res) => {
	const newGame = req.body as Game;
	await useDatabase(async db => db.games.push(newGame));
	res.json({
		status: "ok",
	});
});

router.get('/game/:gameId', async (req, res) => {
	const gameId = req.params.gameId;
	const game = await useDatabase(async db => {
		return db.games.find(game => game.id === gameId);
	});
	if (!game) {
		res.status(404).json({
			status: "error",
			message: `Game with ID ${gameId} not found`,
		});
	}
	else {
		res.json({
			status: "ok",
			game,
		});
	}
});

router.patch('/game/:gameId', async (req, res) => {
	const gameId = req.params.gameId;
	const updatedGame = req.body as Game;
	const success = await useDatabase(async db => {
		const idx = db.games.findIndex(game => game.id === gameId);
		if (idx === -1) {
			res.status(404).json({
				status: "error",
				message: `Game with ID ${gameId} not found`,
			});
			return false;
		}
		db.games.splice(idx, 1, updatedGame);
		return true;
	});
	if (success) {
		res.json({
			status: "ok",
		});
	}
});

router.get('/users', async (_, res) => {
	await useDatabase(async db => {
		res.json(db.users);
	});
});

router.post('/user/new', async (req, res) => {
	let nickname: string;
	try {
		nickname = req.body.nickname;
	}
	catch(e) {
		res.status(400).json({
			status: "error",
			message: "Invalid JSON in body",
		});
		return;
	}
	const nickRegex = /^[A-Za-z][A-Za-z0-9-_]*$/;
	if (!nickRegex.test(nickname)) {
		req.statusMessage = 'Unprocessable Entity';
		res.status(422).json({
			status: "error",
			message: "Invalid nickname; only English letters, digits, dash - and underscore _ allowed; only letters first!",
			regex: nickRegex.source,
		});
		return;
	}
	if ((await loadDatabase()).users.some(user => user.nickname === nickname)) {
		res.status(409).json({
			status: "error",
			message: `Nickname ${nickname} is already used`,
		});
		return;
	}
	const newUser = {
		id: nanoid(),
		nickname,
		secret: nanoid(),
		stats: {
			local: {
				total: 0,
				won: 0,
			},
			online: {
				total: 0,
				won: 0,
			}
		},
	} as User;
	await useDatabase(async db => db.users.push(newUser));
	res.json({
		status: "ok",
		user: newUser,
	})
});

router.get('/user/:userId', async (req, res) => {
	const userId = req.params.userId;
	const user = await useDatabase(async db => {
		return db.users.find(user => user.id === userId);
	});
	if (!user) {
		res.status(404).json({
			status: "error",
			message: `User with ID ${userId} not found`,
		})
	}
	else {
		res.json({
			status: "ok",
			user,
		})
	}
});
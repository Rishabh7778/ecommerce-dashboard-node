import express from 'express';
import { register, login } from '../controllers/AuthController';

const router = express.Router();

// 1. Register Route
router.post('/register', register);
// 2. Login Route
router.post('/login', login);

export default router;
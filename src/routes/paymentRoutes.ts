import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController';
import { verifyToken } from '../middlewares/authMIddleware';

const router = express.Router();
router.post('/create-order', verifyToken, createOrder);
router.post('/verify-payment', verifyToken, verifyPayment);

export default router;
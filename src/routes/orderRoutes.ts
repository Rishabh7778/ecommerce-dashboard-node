import express from 'express';
import { getMyOrders, getAllOrdersAdmin, updateOrderStatus } from '../controllers/orderController';
import { verifyToken, isAdmin } from '../middlewares/authMIddleware';

const router = express.Router();

// 1. USER ROUTE: Koi bhi logged-in user apni details dekh sakta hai
router.get('/my-orders', verifyToken, getMyOrders);

// 2. ADMIN ROUTE: Sirf admin hi sabke orders dekh sakta hai
router.get('/all-orders', verifyToken, isAdmin, getAllOrdersAdmin);

// 3. ADMIN ROUTE: Delivery status update karne ke liye
router.put('/update-status/:id', verifyToken, isAdmin, updateOrderStatus);

export default router;
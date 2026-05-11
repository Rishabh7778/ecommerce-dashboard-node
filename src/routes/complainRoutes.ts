import express from 'express';
import { getAllComplaints, resolveComplaint, createComplaint } from '../controllers/complaintController';
import { verifyToken, isAdmin } from '../middlewares/authMIddleware'; 

const router = express.Router();

// User ke liye
router.post('/add', verifyToken, createComplaint); 

// Admin ke liye
router.get('/all', verifyToken, isAdmin, getAllComplaints);
router.put('/resolve/:id', verifyToken, isAdmin, resolveComplaint);

export default router;
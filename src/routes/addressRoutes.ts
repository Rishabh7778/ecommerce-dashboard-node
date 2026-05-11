import express from 'express';
import { addAddress, getMyAddresses, updateAddress } from '../controllers/addressController';
import { verifyToken } from '../middlewares/authMIddleware';

const router = express.Router();

// Saare routes par auth middleware laga diya hai
router.post('/add', verifyToken, addAddress);
router.get('/my-addresses', verifyToken, getMyAddresses);
router.put('/update/:id', verifyToken, updateAddress);

export default router;
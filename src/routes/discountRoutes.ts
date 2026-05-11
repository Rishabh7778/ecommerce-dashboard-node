// routes/categoryRoutes.ts
import express from 'express';
import { verifyToken, isAdmin } from '../middlewares/authMIddleware';
import { applyCategoryDiscount, getAllCategories, removeCategoryDiscount } from '../controllers/discountController';

const router = express.Router();

// 👇 Exact URLs yahi hone chahiye:
router.get('/getAll', getAllCategories); 
router.post('/apply-discount', verifyToken, isAdmin, applyCategoryDiscount); 
router.put('/remove-discount/:id', verifyToken, isAdmin, removeCategoryDiscount);

export default router;
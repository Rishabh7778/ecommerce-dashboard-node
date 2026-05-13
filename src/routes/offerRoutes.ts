import express from 'express';
import { getDeals, createDealFromProduct, deleteDeal, getEligibleProducts } from '../controllers/offerController';
import { verifyToken, isAdmin } from '../middlewares/authMIddleware';

const router = express.Router();

// 1. Get active deals (Users & Admin)
router.get('/', getDeals);

// 2. Fetch all products (category wise) so Admin can select them for deals
router.get('/eligible-products', verifyToken, isAdmin, getEligibleProducts);

// 3. Create a deal by passing just productId and targetDate (NO Multer/Image upload)
router.post('/add-from-product', verifyToken, isAdmin, createDealFromProduct); 

// 4. Delete a deal
router.delete('/:id', verifyToken, isAdmin, deleteDeal);

export default router;
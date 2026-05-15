import express from 'express';
import { 
    addProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct ,
    bulkAddProducts,
    getAllCategories,
    getDashboardStats,
    addReview,
    getProductReviews
} from '../controllers/productController';
import { upload } from '../middlewares/cloudinaryConfig';
import { verifyToken } from '../middlewares/authMIddleware'; 

const router = express.Router();

// ==========================================
// 1. STATIC ROUTES (Hamesha Upar Rakhein)
// ==========================================
router.post('/add', upload.array('images', 10), addProduct);
router.post('/bulk-add', upload.array('images', 10), bulkAddProducts);

router.get('/getAll', getAllProducts);
router.get('/dashboard-stats', getDashboardStats);
router.get('/categories/getAll', getAllCategories);

// Review Post karne ka route
router.post('/review', verifyToken, addReview);


// ==========================================
// 2. DYNAMIC ROUTES (Hamesha Niche Rakhein)
// ==========================================
// Ye routes jinme ':id' hai, unko sabse last mein rakhna safe hota hai
router.get('/get/:id', getProductById);
router.get('/review/:id', getProductReviews);

router.put('/update/:id', upload.array('images', 10), updateProduct);
router.delete('/delete/:id', deleteProduct);

export default router;
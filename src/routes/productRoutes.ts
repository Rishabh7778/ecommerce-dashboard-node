import express from 'express';
import { 
    addProduct, 
    getAllProducts, 
    getProductById, 
    updateProduct, 
    deleteProduct ,
    bulkAddProducts,
    getAllCategories,
    getDashboardStats
} from '../controllers/productController';
import { upload } from '../middlewares/cloudinaryConfig';


const router = express.Router();

// Create (Bulk & Single)
router.post('/add',upload.array('images', 10), addProduct);
router.post('/bulk-add',upload.array('images', 10), bulkAddProducts);

// Read All
router.get('/getAll', getAllProducts);

// Read One
router.get('/get/:id', getProductById);

router.get('/dashboard-stats', getDashboardStats);

router.get('/categories/getAll', getAllCategories);

// Update (Edit)
router.put('/update/:id', upload.array('images', 10), updateProduct);

// Delete
router.delete('/delete/:id', deleteProduct);



export default router;
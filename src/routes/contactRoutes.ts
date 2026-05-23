import Routes from 'express';
import { postMessage, getAllMessages } from '../controllers/contactController';
import { verifyToken, isAdmin } from '../middlewares/authMIddleware';

const router = Routes.Router();

// 1. Public Route: Contact Form Submit karne ke liye (Koi bhi use kar sakta hai)
router.post('/', postMessage);
// 2. Admin Route: Saare messages dekhne ke liye (Sirf Admin ke liye)
router.get('/admin/messages', verifyToken, isAdmin, getAllMessages);

export default router;
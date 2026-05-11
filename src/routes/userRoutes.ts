import express from 'express';
import { 
    getAllUsers, 
    getUserById, 
    updateUserRole, 
    deleteUser 
} from '../controllers/userControllers';

const router = express.Router();

// Read All Users
router.get('/getAll', getAllUsers);

// Read Single User
router.get('/get/:id', getUserById);

// Update User Role (e.g., Make someone Admin)
router.put('/update-role/:id', updateUserRole);

// Delete User
router.delete('/delete/:id', deleteUser);

export default router;
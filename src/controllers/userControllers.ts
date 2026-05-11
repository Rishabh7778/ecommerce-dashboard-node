import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// ==========================================
// 1. GET ALL USERS (Admin ke liye list)
// ==========================================
// ==========================================
// 1. GET ALL USERS (Sirf Top Buyers aur Real Customers)
// ==========================================
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        // 🔥 FIX: 
        // 1. u.role = 'user' (Admin ko chupa dega)
        // 2. JOIN orders (Sirf unko layega jinhone order kiya hai)
        // 3. ORDER BY total_orders DESC (Sabse zyada order wale upar)
        const sql = `
            SELECT 
                u.id, 
                u.name, 
                u.email, 
                u.role, 
                u.created_at,
                COUNT(o.id) as total_orders
            FROM users u
            INNER JOIN orders o ON u.id = o.user_id
            WHERE u.role = 'user'
            GROUP BY u.id
            ORDER BY total_orders DESC
        `;
        const [users] = await db.execute<RowDataPacket[]>(sql);

        res.status(200).json({ 
            success: true, 
            total: users.length,
            users: users 
        });
    } catch (error: any) {
        console.error("Get All Users Error:", error.message);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 2. GET SINGLE USER BY ID
// ==========================================
export const getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        // 🔥 FIX: Yahan se bhi 'phone' hata diya gaya hai
        const sql = `
            SELECT id, name, email, role, created_at 
            FROM users 
            WHERE id = ?
        `;
        const [rows] = await db.execute<RowDataPacket[]>(sql, [id]);

        if (rows.length === 0) {
            res.status(404).json({ success: false, message: "User not found!" });
            return;
        }

        res.status(200).json({ success: true, user: rows[0] });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 3. UPDATE USER ROLE (Admin/User switch karna)
// ==========================================
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { role } = req.body; // e.g., 'admin' ya 'user'

        if (!role) {
            res.status(400).json({ success: false, message: "Role is required (admin/user)" });
            return;
        }

        const sql = `UPDATE users SET role = ? WHERE id = ?`;
        const [result] = await db.execute<ResultSetHeader>(sql, [role, id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ success: false, message: "User not found!" });
            return;
        }

        res.status(200).json({ success: true, message: `User role updated to ${role}!` });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 4. DELETE USER (Admin agar kisi ko block/delete kare)
// ==========================================
export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        
        const sql = `DELETE FROM users WHERE id = ?`;
        const [result] = await db.execute<ResultSetHeader>(sql, [id]);

        if (result.affectedRows === 0) {
            res.status(404).json({ success: false, message: "User not found!" });
            return;
        }

        res.status(200).json({ success: true, message: "User deleted successfully!" });
    } catch (error: any) {
        res.status(500).json({ success: false, error: error.message });
    }
};
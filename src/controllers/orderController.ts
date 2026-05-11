import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket } from 'mysql2';

// ==========================================
// 1. FOR USER: Get Only My Orders
// ==========================================
export const getMyOrders = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        const sql = `
            SELECT 
                o.id AS order_primary_id,
                oi.id AS item_unique_id, 
                o.order_id, 
                oi.price AS amount, 
                o.status, 
                oi.delivery_status, /* Item ka individual status */
                o.created_at,
                a.fullName, a.city, a.pincode,
                oi.product_name AS products
            FROM orders o
            LEFT JOIN addresses a ON o.address_id = a.id
            INNER JOIN order_items oi ON o.id = oi.order_id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
        `;
        
        const [orders] = await db.query<RowDataPacket[]>(sql, [userId]);
        res.status(200).json({ orders, success: true });
    } catch (error: any) {
        console.error("Get My Orders Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. FOR ADMIN: Get All Orders
// ==========================================
// 🔥 YAHAN NAAM THEEK KAR DIYA HAI (getAllOrdersAdmin) taaki routes match ho jaye
export const getAllOrdersAdmin = async (req: any, res: Response) => {
    try {
        const sql = `
            SELECT 
                o.id AS order_primary_id,
                oi.id AS item_unique_id, 
                o.order_id, 
                o.payment_id, 
                oi.price AS amount,
                o.status, 
                oi.delivery_status AS delivery_status, 
                o.created_at,
                u.name AS userName, 
                u.email AS userEmail,
                oi.product_name AS products
            FROM orders o
            LEFT JOIN users u ON o.user_id = u.id
            INNER JOIN order_items oi ON o.id = oi.order_id
            ORDER BY o.created_at DESC
        `;
        const [orders] = await db.query<RowDataPacket[]>(sql);
        res.status(200).json({ orders, success: true });
    } catch (error: any) {
        console.error("Get All Orders Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. FOR ADMIN: Update Delivery Status
// ==========================================
export const updateOrderStatus = async (req: any, res: Response) => {
    try {
        const itemId = req.params.id; 
        const { delivery_status } = req.body; 

        if (!delivery_status) return res.status(400).json({ message: "Delivery status is required!" });

        const sql = `UPDATE order_items SET delivery_status = ? WHERE id = ?`;
        const [result]: any = await db.query(sql, [delivery_status, itemId]);

        if (result.affectedRows === 0) return res.status(404).json({ message: "Item not found" });

        res.status(200).json({ message: "Status updated successfully!", success: true });
    } catch (error: any) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ error: error.message });
    }
};
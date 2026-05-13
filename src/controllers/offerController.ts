import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ==========================================
// 1. ADMIN: Fetch Products Grouped/Sorted by Category
// ==========================================
export const getEligibleProducts = async (req: Request, res: Response) => {
    try {
        const sql = `
            SELECT p.id, p.title, p.brand, p.price, p.oldPrice, p.img, c.name as category_name
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            ORDER BY c.name ASC, p.created_at DESC
        `;
        const [products] = await db.query<RowDataPacket[]>(sql);
        res.status(200).json({ products, success: true });
    } catch (error: any) {
        console.error("Get Eligible Products Error:", error);
        res.status(500).json({ error: error.message });
    }
};
// ==========================================
// 2. ALL: Get Active Deals (JOIN Laga Hua Hai)
// ==========================================
export const getDeals = async (req: Request, res: Response) => {
    try {
        // 🔥 FIX: Deals table se time aur Products table se baaki details JOIN karke layenge
        const sql = `
            SELECT 
                d.id, 
                p.id AS productId,
                p.title, 
                IFNULL(p.brand, 'Generic') AS brand, 
                p.price, 
                IFNULL(p.oldPrice, p.price) AS oldPrice, 
                p.img, 
                (UNIX_TIMESTAMP(d.target_date) * 1000) AS targetDate 
            FROM deals_of_the_day d
            JOIN products p ON d.product_id = p.id
            ORDER BY d.created_at DESC
        `;
        const [deals] = await db.query<RowDataPacket[]>(sql);
        res.status(200).json({ deals, success: true });
    } catch (error: any) {
        console.error("Get Deals Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. ADMIN: Add to Deals (Sirf ID aur Time insert hoga)
// ==========================================
export const createDealFromProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, targetDate } = req.body;

        if (!productId || !targetDate) {
            res.status(400).json({ message: "Product ID and Target Date are required!" });
            return;
        }

        // 🔥 FIX: Nayi table ke hisaab se sirf product_id aur target_date insert karenge
        const sql = `INSERT INTO deals_of_the_day (product_id, target_date) VALUES (?, ?)`;

        const [result] = await db.query<ResultSetHeader>(sql, [productId, targetDate]);

        res.status(201).json({ 
            message: "Product added to Deals of the Day!", 
            dealId: result.insertId,
            success: true 
        });
    } catch (error: any) {
        console.error("Create Deal Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. ADMIN: Delete Deal
// ==========================================
export const deleteDeal = async (req: Request, res: Response) => {
    try {
        const dealId = req.params.id;
        const sql = `DELETE FROM deals_of_the_day WHERE id = ?`;
        const [result] = await db.query<ResultSetHeader>(sql, [dealId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Deal not found" });
        }

        res.status(200).json({ message: "Deal removed successfully!", success: true });
    } catch (error: any) {
        console.error("Delete Deal Error:", error);
        res.status(500).json({ error: error.message });
    }
};
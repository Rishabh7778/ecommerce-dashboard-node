import db from '../config/db';

// 1. Saari categories fetch karne ka function
export const getAllCategories = async (req: any, res: any) => {
    try {
        // Hum saari details le rahe hain taaki Admin ko purana discount bhi dikh sake
        const sql = `SELECT * FROM categories ORDER BY name ASC`;
        
        const [categories] = await db.query(sql);

        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Apply Discount wala function (Jo aapne pehle likha tha)
export const applyCategoryDiscount = async (req: any, res: any) => {
    try {
        const { categoryId, discount, startDate, expiryDate } = req.body;

        const sql = `UPDATE categories 
                     SET discount_percentage = ?, 
                         discount_start_date = ?, 
                         discount_expiry_date = ? 
                     WHERE id = ?`;

        await db.query(sql, [discount, startDate, expiryDate, categoryId]);

        res.status(200).json({ message: "Discount applied to category!", success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// controllers/discountController.ts (File ke end mein add karein)

// 3. Discount Remove karne wala function
export const removeCategoryDiscount = async (req: any, res: any) => {
    try {
        const { id } = req.params;

        // Discount percentage 0 kar do aur dates ko NULL kar do
        const sql = `UPDATE categories 
                     SET discount_percentage = 0, 
                         discount_start_date = NULL, 
                         discount_expiry_date = NULL 
                     WHERE id = ?`;

        await db.query(sql, [id]);

        res.status(200).json({ message: "Discount hata diya gaya hai!", success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
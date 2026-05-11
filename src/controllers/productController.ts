import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { v2 as cloudinary } from 'cloudinary';

// ==========================================
// 1. CREATE: Add Product (Handles Single/Multiple Images)
// ==========================================
export const addProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = req.body;
        
        // --- IMAGE LOGIC (Cloudinary URLs) ---
        let imageUrls: string | null = null;

        if (req.file) {
            // Agar single image upload hui hai (upload.single('img'))
            imageUrls = (req.file as any).path;
        } else if (req.files && Array.isArray(req.files)) {
            // Agar multiple images upload hui hain (upload.array('images'))
            // Hum saare URLs ko comma (,) se join karke string bana denge
            imageUrls = (req.files as any[]).map(file => file.path).join(',');
        }

        const { 
            title, description, category_id, brand, price, oldPrice, sku, 
            stockCount, weight, mfgDate, expiryDate, badge, badgeColor, discount, status 
        } = data;

        const sql = `
            INSERT INTO products 
            (title, description, category_id, brand, price, oldPrice, sku, stockCount, weight, mfgDate, expiryDate, badge, badgeColor, discount, status, img) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            title, 
            description || null, 
            category_id, 
            brand || 'Generic',
            price, 
            oldPrice || null, 
            sku || null, 
            stockCount || 0,
            weight || null, 
            mfgDate || null, 
            expiryDate || null,
            badge || 'None', 
            badgeColor || '#3BB77E', 
            discount || 0, 
            status || 'published',
            imageUrls // Cloudinary URLs yahan save honge
        ];

        const [result] = await db.execute<ResultSetHeader>(sql, params);
        res.status(201).json({ 
            message: "Product Dealport par live ho gaya!", 
            productId: result.insertId, 
            success: true 
        });

    } catch (error: any) {
        console.error("Add Product Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};


// ==========================================
// 2. READ: Get All Products (With Category Name & Pagination)
// ==========================================
export const getAllProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        // Query params se page aur limit nikalo (default: page 1, limit 12)
        // Agar string "all" aaya limit me, toh pagination nahi karenge
        const page = parseInt(req.query.page as string) || 1;
        const limitStr = req.query.limit as string;
        
        let limit = 12; // default 12 products per page
        let isPaginated = true;

        if (limitStr === 'all') {
            isPaginated = false;
        } else if (limitStr) {
            limit = parseInt(limitStr);
        }

        const offset = (page - 1) * limit;

        // 1. Total Count nikalna zaroori hai frontend ke pagination logic ke liye
        const countSql = `SELECT COUNT(*) as total FROM products`;
        const [countResult]: any = await db.query(countSql);
        const totalProducts = countResult[0].total;

        // 2. Asli data fetch karna (LIMIT aur OFFSET ke sath)
        let sql = `
            SELECT 
                p.*, 
                c.discount_percentage,
                c.name as category_name,
                CASE 
                    WHEN c.discount_start_date <= NOW() AND c.discount_expiry_date >= NOW() 
                    THEN ROUND(p.price * (1 - c.discount_percentage / 100), 2)
                    ELSE p.price 
                END AS discounted_price
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
        `;

        let params: number[] = [];

        if (isPaginated) {
            sql += ` LIMIT ? OFFSET ?`;
            params = [limit, offset];
        }

        const [products] = await db.query(sql, params);

        // 3. Response bhejna (products ke sath meta data bhi)
        if (isPaginated) {
            res.status(200).json({
                products,
                pagination: {
                    total: totalProducts,
                    page: page,
                    limit: limit,
                    totalPages: Math.ceil(totalProducts / limit)
                }
            });
        } else {
            // Agar limit=all bheja, toh direct array bhej do (Pichle format jaisa)
            // Ye purane code ko break nahi hone dega jahan apne pagination handle nahi kiya tha
            res.status(200).json(products); 
        }

    } catch (error: any) {
        console.error("Get Products Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 3. READ ONE: Get Single Product by ID
// ==========================================
export const getProductById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const sql = `
            SELECT p.*, c.name as categoryName 
            FROM products p
            LEFT JOIN categories c ON p.category_id = c.id
            WHERE p.id = ?
        `;
        const [rows] = await db.execute<RowDataPacket[]>(sql, [id]);

        if (rows.length === 0) {
            res.status(404).json({ message: "Product not found!" });
            return;
        }
        res.status(200).json(rows[0]);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 4. UPDATE: Edit Product (With New Image support)
// ==========================================
export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const data = req.body;

        // 🔥 FIX: Frontend se 'existingImage' aa raha hai, agar nayi image nahi hai toh isko rakho
        let imageUrls = data.existingImage || data.img || null; 

        // Agar user ne nayi image upload ki hai, toh wo replace ho jayegi
        if (req.file) {
            imageUrls = (req.file as any).path;
        } else if (req.files && Array.isArray(req.files) && req.files.length > 0) {
            imageUrls = (req.files as any[]).map(file => file.path).join(',');
        }

        const sql = `
            UPDATE products 
            SET title = ?, description = ?, category_id = ?, brand = ?, price = ?, 
                oldPrice = ?, sku = ?, stockCount = ?, weight = ?, mfgDate = ?, 
                expiryDate = ?, badge = ?, badgeColor = ?, discount = ?, status = ?, img = ?
            WHERE id = ?
        `;
        
        const params = [
            data.title, 
            data.description || null, 
            data.category_id, 
            data.brand || 'Generic', 
            data.price, 
            data.oldPrice || null, 
            data.sku || null, 
            data.stockCount || 0, 
            data.weight || null, 
            data.mfgDate || null, 
            data.expiryDate || null, 
            data.badge || 'None', 
            data.badgeColor || '#3BB77E', 
            data.discount || 0, 
            data.status || 'published', 
            imageUrls, 
            id
        ];

        const [result] = await db.execute<ResultSetHeader>(sql, params);
        res.status(200).json({ message: "Product updated successfully!", success: true });
    } catch (error: any) {
        console.error("Update Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 5. DELETE: Remove Product
// ==========================================
export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        await db.execute('DELETE FROM products WHERE id = ?', [id]);
        res.status(200).json({ message: "Product deleted successfully!", success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 6. BULK CREATE: JSON Data Only
// ==========================================
export const bulkAddProducts = async (req: Request, res: Response) => {
    try {
        const products = req.body;
        
        if (!Array.isArray(products)) {
            return res.status(400).json({ error: "Array required" });
        }

        // 🔥 STEP 1: Saari images ko pehle Cloudinary par upload karo
        const productsWithImages = await Promise.all(
            products.map(async (p: any, index: number) => {
                let imageUrl = null;

                // Agar image hai, aur wo pehle se link nahi hai (jaise Base64 string aayi hai)
                if (p.img && !p.img.startsWith('http')) {
                    try {
                        const uploadRes = await cloudinary.uploader.upload(p.img, {
                            folder: "dealport_products" // Cloudinary me folder ka naam
                        });
                        imageUrl = uploadRes.secure_url; // Cloudinary ka pakka link
                    } catch (uploadErr) {
                        console.error(`Failed to upload image for ${p.title}:`, uploadErr);
                        // Agar image fail ho jaye, toh hum null bhejenge ya aap chaho toh error throw kar sakte ho
                    }
                } else if (p.img && p.img.startsWith('http')) {
                    // Agar pehle se hi direct URL bheja hai frontend ne
                    imageUrl = p.img;
                }

                // Naya object return karo jisme 'img' ki jagah Cloudinary ka URL ho
                return { ...p, img: imageUrl };
            })
        );

        // 🔥 STEP 2: Ab database me daalne ke liye values set karo
        const values = productsWithImages.map((p: any, index: number) => [
            p.title, 
            p.description, 
            p.category_id, 
            p.brand, 
            p.price, 
            p.oldPrice, 
            p.sku || `SKU-${Date.now()}-${index}`, // 🔥 BUG FIX: '-index' lagaya taaki sabka SKU alag bane
            p.stockCount, 
            p.weight, 
            p.mfgDate, 
            p.expiryDate, 
            p.badge, 
            p.badgeColor, 
            p.discount, 
            p.status || 'published',
            p.img // Ye ab Cloudinary ka link hai
        ]);

        // 🔥 STEP 3: Database me Bulk Insert
        const sql = `INSERT INTO products 
            (title, description, category_id, brand, price, oldPrice, sku, stockCount, weight, mfgDate, expiryDate, badge, badgeColor, discount, status, img) 
            VALUES ?`;

        const [result]: any = await db.query(sql, [values]);
        res.status(201).json({ message: `${result.affectedRows} Products successfully saved with images!`, success: true });

    } catch (error: any) {
        console.error("Bulk Add Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 7. GET ALL CATEGORIES: Dropdown ke liye
// ==========================================
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM categories ORDER BY name ASC');
        res.status(200).json(rows);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};


// dashboardController.ts ya productController.ts mein
// dashboardController.ts mein stats wali query badal dein
export const getDashboardStats = async (req: any, res: any) => {
    try {
        const [users]: any = await db.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
        const [products]: any = await db.query("SELECT COUNT(*) as count FROM products");

        const [orderStats]: any = await db.query(`
            SELECT COUNT(DISTINCT order_id) as totalOrders, SUM(amount) as totalSales FROM orders
        `);

        const [salesData]: any = await db.query(`
            SELECT DAYNAME(created_at) as name, SUM(amount) as value 
            FROM orders 
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DATE(created_at)
            ORDER BY DATE(created_at) ASC
        `);

        // 🔥 CRASH FIX: Abhi ke liye hum JOIN nahi laga rahe, sirf latest 4 products bhej rahe hain
        // Taaki aapka dashboard aur graph turant wapas aa jaye.
        const [topProducts]: any = await db.query(`
            SELECT title as name, sku as id, price, img, 0 as total_sold
            FROM products 
            ORDER BY id DESC
            LIMIT 4
        `);

        res.status(200).json({
            customers: users[0].count || 0,
            totalProducts: products[0].count || 0,
            totalOrders: orderStats[0].totalOrders || 0, 
            totalSales: orderStats[0].totalSales || 0,
            chartData: salesData,
            topProducts: topProducts, 
            success: true
        });
    } catch (error: any) {
        console.error("Dashboard API Error:", error.message); // Taki backend terminal me error dikhe
        res.status(500).json({ error: error.message });
    }
};
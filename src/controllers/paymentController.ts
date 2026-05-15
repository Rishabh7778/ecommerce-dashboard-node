import Razorpay from 'razorpay';
import crypto from 'crypto';
import db from '../config/db';
import { ResultSetHeader } from 'mysql2';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// =========================================
// 1. CREATE ORDER API (Updated)
// =========================================
export const createOrder = async (req: any, res: any) => {
    try {
        const userId = req.user.id; // Auth middleware se aayega
        const { amount, address_id } = req.body; 

        if (!address_id) {
            return res.status(400).json({ message: "Address ID is required!" });
        }

        const options = {
            amount: Math.round(amount * 100), // Paise mein convert (Ensure it's an integer)
            currency: "INR",
            receipt: `rcpt_${userId}_${Date.now()}`,
        };

        const razorpayOrder = await razorpay.orders.create(options);

        // SQL mein save karein: user_id aur address_id ke saath
        const sql = `INSERT INTO orders (user_id, address_id, order_id, amount, status, delivery_status) 
                     VALUES (?, ?, ?, ?, 'pending', 'processing')`;
        
        await db.query(sql, [userId, address_id, razorpayOrder.id, amount]);

        res.status(201).json(razorpayOrder);
    } catch (error: any) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// =========================================
// 2. VERIFY PAYMENT API (Updated with Items)
// =========================================
export const verifyPayment = async (req: any, res: any) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, cartItems } = req.body;

        // Signature Validation
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature === expectedSign) {
            // A. Payment Success: Update Orders Table
            const updateOrderSql = `UPDATE orders SET payment_id = ?, status = 'success' WHERE order_id = ?`;
            await db.query(updateOrderSql, [razorpay_payment_id, razorpay_order_id]);

            // B. Get internal 'orders.id' (Database ID) using 'razorpay_order_id'
            const [orderRows]: any = await db.query('SELECT id FROM orders WHERE order_id = ?', [razorpay_order_id]);
            const internalOrderId = orderRows[0].id;

            // C. Insert Items into 'order_items' table
            if (cartItems && cartItems.length > 0) {
                const itemSql = `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, delivery_status) VALUES ?`;
                
                const values = cartItems.map((item: any) => [
                    internalOrderId, 
                    item.id,          
                    item.title,       
                    item.quantity, 
                    item.price * item.quantity, // 🔥 FIX 1: 34 * 2 = 68 calculate hoke save hoga
                    'processing'      
                ]);

                await db.query(itemSql, [values]);

                // 🔥 FIX 2: STOCK MANAGEMENT LOGIC
                // Har cart item ke liye database me stock minus karein
                for (const item of cartItems) {
                    // WHERE condition me >= item.quantity lagaya hai taaki stock negative na ho jaye
                    const updateStockSql = `UPDATE products SET stockCount = stockCount - ? WHERE id = ? AND stockCount >= ?`;
                    await db.query(updateStockSql, [item.quantity, item.id, item.quantity]);
                }
            }
            
            return res.status(200).json({ message: "Payment Verified, Order Placed & Stock Updated!" });
        } else {
            return res.status(400).json({ message: "Invalid Signature" });
        }
    } catch (error: any) {
        console.error("Verify Payment Error:", error);
        res.status(500).json({ error: error.message });
    }
};
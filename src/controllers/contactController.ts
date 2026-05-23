import db from '../config/db';
import { Request, Response } from 'express';

// 1. POST: Save Contact Message (With Validation)
export const postMessage = async (req: Request, res: Response) => {
    try {
        const { name, email, subject, message } = req.body;

        // Basic Backend Validation
        if (!name || !email || !subject || !message) {
            return res.status(400).json({ error: "Saare fields (Name, Email, Subject, Message) zaroori hain." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Sahi email address darj karein." });
        }

        const sql = 'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)';
        await db.query(sql, [name, email, subject, message]);
        
        res.status(200).json({ message: "Message received! We'll get back to you soon." });
    } catch (error: any) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Internal Server Error. Please try again later." });
    }
};

// 2. GET: Fetch Messages (With Pagination for Admin)
export const getAllMessages = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        const sql = 'SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT ? OFFSET ?';
        
        // 🔥 CRITICAL FIX: MySQL queries me limit/offset explicitly Number format me hone chahiye
        const [messages] = await db.query(sql, [Number(limit), Number(offset)]);
        
        // Get total count for frontend pagination
        const [totalRows]: any = await db.query('SELECT COUNT(*) as count FROM contact_messages');
        const total = totalRows[0].count;

        res.status(200).json({
            data: messages,
            pagination: {
                total_records: total,
                current_page: page,
                total_pages: Math.ceil(total / limit)
            }
        });
    } catch (error: any) {
        console.error("Error fetching messages:", error);
        res.status(500).json({ error: "Internal Server Error." });
    }
};
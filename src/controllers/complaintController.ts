import { Request, Response } from 'express';
import db from '../config/db';
import { RowDataPacket } from 'mysql2';

// FOR ADMIN: Get All Complaints with User & Phone Info
export const getAllComplaints = async (req: any, res: Response) => {
    try {
        // SQL mein hum User table aur Address table ko JOIN kar rahe hain
        // Subquery (SELECT phone...) isliye lagayi hai taaki user ka 'Default' phone number mile
        const sql = `
            SELECT 
                c.id, c.subject, c.message, c.status, c.created_at,
                u.name as userName, u.email as userEmail,
                (SELECT phone FROM addresses WHERE user_id = c.user_id ORDER BY isDefault DESC LIMIT 1) as userPhone
            FROM complaints c
            LEFT JOIN users u ON c.user_id = u.id
            ORDER BY c.created_at DESC
        `;
        
        const [complaints] = await db.query<RowDataPacket[]>(sql);
        res.status(200).json({ complaints, success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// FOR ADMIN: Update Complaint Status (Pending -> Resolved)
export const resolveComplaint = async (req: any, res: Response) => {
    try {
        const complaintId = req.params.id;
        const sql = `UPDATE complaints SET status = 'resolved' WHERE id = ?`;
        await db.query(sql, [complaintId]);
        res.status(200).json({ message: "Complaint resolved!", success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// 3. FOR USER: Add New Complaint / Query
export const createComplaint = async (req: any, res: Response) => {
    try {
        const userId = req.user.id; // Token se milega
        const { subject, message } = req.body;

        if (!subject || !message) {
            return res.status(400).json({ message: "Bhai, subject aur message dono zaroori hain!" });
        }

        const sql = `INSERT INTO complaints (user_id, subject, message, status) VALUES (?, ?, ?, 'pending')`;
        await db.query(sql, [userId, subject, message]);

        res.status(201).json({ message: "Message sent successfully!", success: true });
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
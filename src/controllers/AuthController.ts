import { Request, Response } from 'express';
import db from '../config/db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

const JWT_SECRET = process.env.JWT_SECRET || 'apna_secret_key_123';

// ==========================================
// 1. REGISTER: Naya User ya Admin banana
// ==========================================
export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body; // role: 'user' ya 'admin'

        // A. Check if user already exists
        const [existingUser] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (existingUser.length > 0) {
            return res.status(400).json({ message: "Bhai, ye email pehle se registered hai!" });
        }

        // B. Password Hash karo (Security ke liye)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // C. Database mein save karo
        const sql = 'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)';
        const [result] = await db.execute<ResultSetHeader>(sql, [
            name, email, hashedPassword, role || 'user'
        ]);

        res.status(201).json({ message: "Registration successful!", success: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// ==========================================
// 2. LOGIN: Admin aur User dono ke liye
// ==========================================
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // A. User ko dhoondo
        const [users] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE email = ?', [email]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User nahi mila! Register karlo pehle." });
        }

        const user = users[0];

        // B. Password Match karo
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Galat Password! Dubara try karo." });
        }

        // C. JWT Token generate karo
        // Isme hum user ID aur Role daal rahe hain
        const token = jwt.sign(
            { id: user.id, role: user.role }, 
            JWT_SECRET, 
            { expiresIn: '1d' } // 1 din tak login rahega
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,     
            sameSite: "none",    
            maxAge: 24 * 60 * 60 * 1000 
    });

        // D. Response bhejo (Password hata kar)
        const { password: _, ...userData } = user;
        res.status(200).json({
            message: `Welcome back, ${user.name}!`,
            user: userData,
            success: true
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
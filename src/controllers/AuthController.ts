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

        const isProduction = process.env.NODE_ENV === 'production';

        // C. JWT Token generate karo
        // Isme hum user ID aur Role daal rahe hain
        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "15m" }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET!,
            { expiresIn: "7d" }
        );

        res.cookie("token", accessToken, {
            httpOnly: true,
            secure: isProduction, 
            sameSite: isProduction ? "none" : "lax", 
            maxAge: 15 * 60 * 1000
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax", 
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        // D. Response bhejo (Password hata kar)
        const { password: _, ...userData } = user;
        res.status(200).json({
            message: `Welcome back, ${user.name}!`,
            user: userData,
            token: accessToken,
            refreshToken: refreshToken,
            success: true
        });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

export const refreshAccessToken = async (req: Request, res: Response) => {
    // 1. Refresh token cookie se nikalo
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        return res.status(401).json({ message: "Refresh token missing" });
    }

    try {
        // 2. Refresh token verify karo
        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET!
        ) as { id: number };

        // 3. User ko DB se fetch karo taaki latest "role" mil sake
        const [users] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM users WHERE id = ?', [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: "User not found!" });
        }

        const user = users[0];

        const isProduction = process.env.NODE_ENV === 'production';

        // 4. Naya Access Token banao (User aur Role dono daalo)
        const newAccessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.ACCESS_TOKEN_SECRET!,
            { expiresIn: "15m" }
        );

        // 5. Nayi cookie set karo (Naam "token" rakho, jaise login me tha)
        res.cookie("token", newAccessToken, {
            httpOnly: true,
            secure: isProduction, // Development ke liye false, production mein true karo
            sameSite: isProduction ? "none" : "lax", // 🔥 YAHAN GADBAD THI: Localhost pe 'lax' hona chahiye
            maxAge: 15 * 60 * 1000 
        });

        // 6. Response bhejo frontend ke liye
        return res.status(200).json({
            success: true,
            token: newAccessToken,
            message: "Token refreshed successfully"
        });

    } catch (error) {
        return res.status(403).json({
            message: "Invalid or expired refresh token"
        });
    }
};
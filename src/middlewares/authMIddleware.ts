import dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


// TypeScript interface for decoded token
interface AuthRequest extends Request {
    user?: any;
}

export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 1. Pehle token ko cookies se nikalne ka try karo (Kyunki login mein cookie set ki hai)
    let token = req.cookies?.token; 

    // 2. Agar cookie mein nahi hai, tab Headers check karo (Postman waghera ke liye fallback)
    if (!token) {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        token = typeof authHeader === 'string' && authHeader.startsWith("Bearer ") 
            ? authHeader.split(" ")[1] 
            : null;
    }

    // 3. Status 403 ki jagah 401 karo taaki frontend ka refresh logic trigger ho
    if (!token) {
        return res.status(401).json({ message: "Bhai, token gayab hai!" });
    }

    try {
        // 4. JWT_SECRET ki jagah ACCESS_TOKEN_SECRET use karo
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || 'secret_key');
        req.user = decoded;
        next();
    } catch (err: any) {
        console.error("JWT Verification Error:", err.message);
        
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: "Bhai, session khatam! Phir se login karo." });
        }
        
        return res.status(401).json({ message: "Invalid Token! Error: " + err.message });
    }
};

export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    // 🔥 YEH LINE ADD KARO:
    console.log("Token ke andar ka data:", req.user); 

    if (req.user && req.user.role === 'admin') {
        next(); 
    } else {
        return res.status(403).json({ message: "Access Denied! Ye sirf Admin ke liye hai." });
    }
};
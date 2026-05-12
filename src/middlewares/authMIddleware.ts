import dotenv from 'dotenv';
dotenv.config();
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


// TypeScript interface for decoded token
interface AuthRequest extends Request {
    user?: any;
}

// A. Login Check Middleware
// B. verifyToken update
export const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
    
    // "Bearer ajsdhkashd..." isme se space ke baad wala hissa (token) nikalna
    const token = typeof authHeader === 'string' && authHeader.startsWith("Bearer ") 
                  ? authHeader.split(" ")[1] 
                  : null;

    if (!token) {
        return res.status(403).json({ message: "Bhai, token gayab hai!" });
    }

    try {
        // 🔥 DEBUG: Secret key console mein print karke check karo
        // console.log("Verifying with secret:", process.env.JWT_SECRET || 'secret_key');
        
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
        req.user = decoded;
        next();
    } catch (err: any) {
        // 🔥 Yahan se pata chalega ki token kyun invalid hai
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
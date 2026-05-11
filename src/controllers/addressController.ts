import { Request, Response } from 'express';
import db from '../config/db';
import { ResultSetHeader, RowDataPacket } from 'mysql2';

// 1. ADD NEW ADDRESS
export const addAddress = async (req: any, res: Response) => {
    try {
        const userId = req.user.id; // Auth middleware se aayega
        const { fullName, phone, streetAddress, city, state, pincode, isDefault } = req.body;

        // Agar user pehla address add kar raha hai, toh usey default bana do
        const [existing] = await db.execute<RowDataPacket[]>('SELECT id FROM addresses WHERE user_id = ?', [userId]);
        const setAsDefault = existing.length === 0 ? true : (isDefault || false);

        // Agar naya address default set karna hai, toh baaki sabko non-default kardo
        if (setAsDefault && existing.length > 0) {
            await db.execute('UPDATE addresses SET isDefault = false WHERE user_id = ?', [userId]);
        }

        const sql = `INSERT INTO addresses (user_id, fullName, phone, streetAddress, city, state, pincode, isDefault) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
                     
        const [result] = await db.execute<ResultSetHeader>(sql, [
            userId, fullName, phone, streetAddress, city, state, pincode, setAsDefault
        ]);

        res.status(201).json({ message: "Address added successfully!", id: result.insertId, success: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// 2. GET ALL ADDRESSES FOR A USER
export const getMyAddresses = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;

        // Default address sabse upar aayega
        const [addresses] = await db.execute<RowDataPacket[]>(
            'SELECT * FROM addresses WHERE user_id = ? ORDER BY isDefault DESC, id DESC', 
            [userId]
        );

        res.status(200).json({ addresses, success: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};

// 3. EDIT/UPDATE ADDRESS
export const updateAddress = async (req: any, res: Response) => {
    try {
        const userId = req.user.id;
        const addressId = req.params.id;
        const { fullName, phone, streetAddress, city, state, pincode, isDefault } = req.body;

        // Check karo ki address isi user ka hai na
        const [check] = await db.execute<RowDataPacket[]>('SELECT id FROM addresses WHERE id = ? AND user_id = ?', [addressId, userId]);
        if (check.length === 0) return res.status(404).json({ message: "Address nahi mila ya aapka nahi hai!" });

        // Agar isko default banaya hai, toh baakiyon ko false karo
        if (isDefault) {
            await db.execute('UPDATE addresses SET isDefault = false WHERE user_id = ?', [userId]);
        }

        const sql = `UPDATE addresses 
                     SET fullName=?, phone=?, streetAddress=?, city=?, state=?, pincode=?, isDefault=? 
                     WHERE id = ? AND user_id = ?`;
                     
        await db.execute(sql, [fullName, phone, streetAddress, city, state, pincode, isDefault, addressId, userId]);

        res.status(200).json({ message: "Address updated successfully!", success: true });

    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
};
import mysql from 'mysql2/promise'; // Seedha promise wala version use karein

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // Agar password hai toh yahan likhein
  database: 'reactecommerce',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Yahan 'export default' hona zaroori hai tabhi 'import db' kaam karega
export default pool;
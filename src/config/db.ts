import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306, // Default 3306 rakhna safe hota hai

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 🔥 Database connection test
pool.getConnection()
  .then((connection) => {
    console.log('✅ MySQL Database Connected Successfully!');
    connection.release(); // Connection check karne ke baad wapas pool mein chhodna zaroori hai
  })
  .catch((err) => {
    console.error('❌ MySQL Database Connection Failed: ', err.message);
  });

export default pool;
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

// Backward-compatible fields for deal pricing and order-price audit.
// Existing databases are updated once at startup; duplicate-column errors are harmless.
const ensureCommerceColumns = async () => {
  const migrations = [
    'ALTER TABLE deals_of_the_day ADD COLUMN discount_percentage DECIMAL(5,2) NOT NULL DEFAULT 0',
    'ALTER TABLE order_items ADD COLUMN original_price DECIMAL(10,2) NULL',
    'ALTER TABLE order_items ADD COLUMN discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0',
    'ALTER TABLE order_items ADD COLUMN discount_label VARCHAR(100) NULL',
    'ALTER TABLE order_items ADD COLUMN product_image TEXT NULL',
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch (error: any) {
      if (error?.code !== 'ER_DUP_FIELDNAME') console.error('Database migration warning:', error.message);
    }
  }
};
ensureCommerceColumns();

export default pool;

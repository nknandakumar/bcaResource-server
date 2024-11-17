import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const db = new pg.Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  ssl: {
    rejectUnauthorized: false,
    sslmode: 'require'
  }
});

// Better connection handling
try {
  await db.connect();
  console.log('Database connected successfully');
} catch (error) {
  console.error('Database connection error:', error);
}

// Handle disconnections
db.on('error', (err) => {
  console.error('Unexpected database error:', err);
  // Attempt to reconnect
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    db.connect();
  }
});

process.on('SIGINT', async () => {
  await db.end();
  process.exit();
});

export default db;
import mysql from "mysql2/promise"

const pool = mysql.createPool({
  host: "127.0.0.1",
  user: "root",
  password: "your_password_here",
  database: "matching_game",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
})

export const db = pool
export { pool }
export default pool

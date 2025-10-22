import mysql from "mysql2/promise"

// 创建数据库连接池
const pool = mysql.createPool({
  host: "43.156.92.151",
  user: "root",
  password: "Lianhuadedie1991!",
  database: "matching_game",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: "utf8mb4",
})

export { pool }
export default pool

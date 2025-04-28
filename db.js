import mysql from "mysql2"; // Regular callback version, not promise
import dotenv from "dotenv";

dotenv.config();

const mysqlUrl = process.env.MYSQL_URL;

if (!mysqlUrl) {
  console.error("MYSQL_URL is not defined in the .env file");
  process.exit(1);
}

// Create a connection pool with the standard callback API
const db = mysql.createPool(mysqlUrl);

// Test connection
db.query("SELECT 1", (err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  }
  console.log("MySQL connected");
});

export default db;

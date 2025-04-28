import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const mysqlUrl = process.env.MYSQL_URL;

if (!mysqlUrl) {
  console.error("MYSQL_URL is not defined in the .env file");
  process.exit(1);
}

// Create a connection pool but still name it db
const db = mysql.createPool(mysqlUrl);

// Simple test to verify the connection
db.query("SELECT 1")
  .then(() => console.log("MySQL connected"))
  .catch((err) => {
    console.error("Error connecting to MySQL:", err);
    process.exit(1);
  });

export default db;

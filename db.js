import mysql from "mysql2";
import dotenv from "dotenv";

dotenv.config();

const mysqlUrl = process.env.MYSQL_URL;

if (!mysqlUrl) {
  console.error("MYSQL_URL is not defined in the .env file");
  process.exit(1);
}

const db = mysql.createConnection(mysqlUrl);

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err);
    throw err;
  }
  console.log("MySQL connected");
});

export default db;

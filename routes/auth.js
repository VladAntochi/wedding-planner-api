// routes/auth.js
import express from "express";
import db from "../db.js"; // Import the database connection
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Define JWT_SECRET from environment variable
const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Register route
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  console.log("Register attempt with email:", email);
  const hashed = await bcrypt.hash(password, 10); // Hash password

  console.log("Hashed password:", hashed);

  db.query(
    "INSERT INTO users (email, password) VALUES (?, ?)",
    [email, hashed],
    (err) => {
      console.error("MySQL error:", err); // 👈 add this
      if (err) return res.status(500).json({ error: "Error creating user" });
      res.status(201).json({
        message: "User created",
      });
    }
  );
});

// Login route
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt with email:", email);
  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, results) => {
      if (err || results.length === 0)
        return res.status(401).json({ error: "Invalid credentials" });

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch)
        return res.status(401).json({ error: "Invalid credentials" });

      const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: "1y" });
      res.json({ token });
    }
  );
});

// Profile route (protected route)
router.get("/profile", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Authorization header
  if (!token) return res.status(401).send("No token provided");

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Invalid token");

    db.query(
      "SELECT email FROM users WHERE id = ?",
      [decoded.id],
      (err, results) => {
        if (err) return res.status(500).send("Server error");
        res.json(results[0]);
      }
    );
  });
});

// Export the router for use in other parts of the app
export default router;

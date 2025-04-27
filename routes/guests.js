import express from "express";
import db from "../db.js"; // Import the database connection
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Endpoint to add a guest to the wedding
router.post("/add-guest", (req, res) => {
  const { name, email, status } = req.body;

  // Extract the token from the request header (assuming you send it in the Authorization header)
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer token

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  // Verify the token and get the user ID
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id; // Assuming the token contains an `id` field for the user

    const sql = `
      INSERT INTO guests 
      (name, email, status, userId) 
      VALUES (?, ?, ?, ?)`;

    db.query(
      sql,
      [name, email, status, userId], // Insert guest details along with userId
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to add guest" });
        }

        res.status(201).json({
          message: "Guest added successfully",
          guest: {
            id: result.insertId,
            name,
            email,
            status,
            userId, // Send back the userId as confirmation
          },
        });
      }
    );
  });
});

router.get("/guests", (req, res) => {
  // Extract the token from the request header
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer token

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  // Verify the token and get the user ID
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id; // Assuming the token contains an `id` field for the user

    const sql = `
        SELECT * FROM guests WHERE userId = ?`;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch guests" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No guests found for this user" });
      }

      res.status(200).json({ guests: results });
    });
  });
});

export default router;

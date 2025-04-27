import express from "express";
import db from "../db.js"; // Import the database connection
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

router.post("/wedding-details", (req, res) => {
  const {
    brideName,
    groomName,
    weddingDate,
    location,
    venue,
    time,
    guestCount,
    dressCode,
  } = req.body;

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
      INSERT INTO wedding_details 
      (bride_name, groom_name, wedding_date, location, venue, time, guest_count, dress_code, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [
        brideName,
        groomName,
        weddingDate,
        location,
        venue,
        time || null,
        guestCount,
        dressCode,
        userId, // Insert the user_id here to associate with the logged-in user
      ],
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res
            .status(500)
            .json({ error: "Failed to save wedding details" });
        }

        res.status(201).json({
          message: "Wedding details saved successfully",
          id: result.insertId,
        });
      }
    );
  });
});

router.get("/wedding-details", (req, res) => {
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

    const userId = decoded.id;

    const sql = `
        SELECT * FROM wedding_details WHERE user_id = ?`;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Failed to fetch wedding details" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No wedding details found for this user" });
      }

      res.status(200).json({ weddingDetails: results });
    });
  });
});

export default router;

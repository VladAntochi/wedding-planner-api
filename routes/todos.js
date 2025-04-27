import express from "express";
import db from "../db.js"; // Import the database connection
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Create a new ToDo
router.post("/todos", (req, res) => {
  const { title, dueDate } = req.body;
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
      INSERT INTO todos 
      (title, completed, due_date, user_id) 
      VALUES (?, ?, ?, ?)`;

    db.query(
      sql,
      [title, false, dueDate || null, userId], // Insert the user_id here to associate with the logged-in user
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to create ToDo item" });
        }

        res.status(201).json({
          message: "ToDo created successfully",
          todo: {
            id: result.insertId,
            title,
            completed: false,
            dueDate,
          },
        });
      }
    );
  });
});

// Get all ToDos for the logged-in user
router.get("/todos", (req, res) => {
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

    const sql = `SELECT * FROM todos WHERE user_id = ?`;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch ToDos" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No ToDos found for this user" });
      }

      res.status(200).json({ todos: results });
    });
  });
});

// Mark ToDo as completed
router.patch("/todos/:id/complete", (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer token

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id;

    // Toggle the 'completed' field
    const sql = `
        UPDATE todos 
        SET completed = NOT completed 
        WHERE id = ? AND user_id = ?
      `;

    db.query(sql, [id, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ error: "Failed to toggle ToDo completion" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "ToDo not found or does not belong to the user" });
      }

      res.status(200).json({ message: "ToDo completion toggled successfully" });
    });
  });
});

router.delete("/todos/:id", (req, res) => {
  const { id } = req.params;
  const token = req.headers.authorization?.split(" ")[1]; // Extract token

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id;

    const sql = `DELETE FROM todos WHERE id = ? AND user_id = ?`;

    db.query(sql, [id, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete ToDo item" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "ToDo not found or does not belong to the user" });
      }

      res.status(200).json({ message: "ToDo deleted successfully" });
    });
  });
});

router.patch("/todos/:id/due-date", (req, res) => {
  const { id } = req.params;
  const { dueDate } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id;

    const sql = `UPDATE todos SET due_date = ? WHERE id = ? AND user_id = ?`;

    console.log("SQL Query:", dueDate);

    db.query(sql, [dueDate || null, id, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update due date" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "ToDo not found or does not belong to the user" });
      }

      console.log("here");
      res.status(200).json({ message: "Due date updated successfully" });
    });
  });
});

export default router;

import express from "express";
import db from "../db.js"; // Import the database connection
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

const router = express.Router();

// Create a new Category
router.post("/categories", (req, res) => {
  const { name, predefinedCategoryId, estimatedBudget } = req.body;
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
      INSERT INTO categories 
      (user_id, name, predefined_category_id, estimated_budget, spent) 
      VALUES (?, ?, ?, ?, ?)`;

    db.query(
      sql,
      [userId, name, predefinedCategoryId || null, estimatedBudget || 0, 0], // Insert the user_id and predefinedCategoryId
      (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to create category" });
        }

        res.status(201).json({
          message: "Category created successfully",
          category: {
            id: result.insertId,
            name,
            predefinedCategoryId,
            estimatedBudget,
            spent: 0,
            expenses: [],
          },
        });
      }
    );
  });
});

// Get all Categories for the logged-in user
router.get("/categories", (req, res) => {
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

    const sql = `SELECT * FROM categories WHERE user_id = ?`;

    db.query(sql, [userId], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to fetch categories" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ message: "No categories found for this user" });
      }

      res.status(200).json({ categories: results });
    });
  });
});

// Create a new Expense for a category
router.post("/expenses", (req, res) => {
  const { categoryId, title, amount } = req.body;
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

    // First, check if the category belongs to the user
    const checkCategorySql = `SELECT * FROM categories WHERE id = ? AND user_id = ?`;
    db.query(checkCategorySql, [categoryId, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to check category" });
      }

      if (result.length === 0) {
        return res
          .status(404)
          .json({ error: "Category not found for this user" });
      }

      // If category is valid, create the expense
      const sql = `
        INSERT INTO expenses 
        (category_id, title, amount, created_at, updated_at) 
        VALUES (?, ?, ?, NOW(), NOW())`;

      db.query(sql, [categoryId, title, amount], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to create expense" });
        }

        res.status(201).json({
          message: "Expense created successfully",
          expense: {
            id: result.insertId,
            categoryId,
            title,
            amount,
          },
        });
      });
    });
  });
});

// Get all Expenses for a specific category (for the logged-in user)
router.get("/expenses/:categoryId", (req, res) => {
  const { categoryId } = req.params;
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

    // First, check if the category belongs to the user
    const checkCategorySql = `SELECT * FROM categories WHERE id = ? AND user_id = ?`;
    db.query(checkCategorySql, [categoryId, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to check category" });
      }

      console.log("categoryId", categoryId);
      if (result.length === 0) {
        return res
          .status(404)
          .json({ error: "Category not found for this user" });
      }

      const sql = `SELECT * FROM expenses WHERE category_id = ?`;

      db.query(sql, [categoryId], (err, results) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Failed to fetch expenses" });
        }

        console.log("results", results);

        if (results.length === 0) {
          return res
            .status(404)
            .json({ message: "No expenses found for this category" });
        }

        res.status(200).json({ expenses: results });
      });
    });
  });
});

// Update an Expense (e.g., amount or title)
router.patch("/expenses/:id", (req, res) => {
  const { id } = req.params;
  const { title, amount } = req.body;
  const token = req.headers.authorization?.split(" ")[1]; // Extract token from Bearer token

  if (!token) {
    return res.status(401).json({ error: "Authentication token is missing" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }

    const userId = decoded.id;

    const sql = `UPDATE expenses SET title = ?, amount = ?, updated_at = NOW() WHERE id = ? AND category_id IN (SELECT id FROM categories WHERE user_id = ?)`;

    db.query(sql, [title, amount, id, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to update expense" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Expense not found or does not belong to the user" });
      }

      res.status(200).json({ message: "Expense updated successfully" });
    });
  });
});

// Delete an Expense
router.delete("/expenses/:id", (req, res) => {
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

    const sql = `DELETE FROM expenses WHERE id = ? AND category_id IN (SELECT id FROM categories WHERE user_id = ?)`;

    db.query(sql, [id, userId], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ error: "Failed to delete expense" });
      }

      if (result.affectedRows === 0) {
        return res
          .status(404)
          .json({ error: "Expense not found or does not belong to the user" });
      }

      res.status(200).json({ message: "Expense deleted successfully" });
    });
  });
});

// Assuming you have a predefined categories table in your DB
router.get("/predefined-categories", (req, res) => {
  const sql = "SELECT * FROM predefined_categories"; // Adjust this to your DB query

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res
        .status(500)
        .json({ error: "Failed to fetch predefined categories" });
    }

    res.status(200).json({ categories: results });
  });
});

export default router;

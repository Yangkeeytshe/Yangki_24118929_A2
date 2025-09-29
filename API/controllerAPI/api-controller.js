var dbcon = require("../event_db");
const path = require("path");


var connection = dbcon.getconnection();
connection.connect();

var express = require('express');
var router = express.Router();


// GET all events
router.get("/", (req, res) => {
    connection.query("select * from event", (err, records, fields) => {
        if (err) {
            console.error("Error while retrieve the data");
        } else {
            res.send(records);
        }
    })
})

// GET event by ID
router.get("/:id", (req, res) => {
  const { id } = req.params;
  connection.query("SELECT * FROM events WHERE id = ?", [id], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (rows.length === 0) return res.status(404).json({ error: "Event not found" });
    res.json(rows[0]);
  });
});


// ======================= GET event by id or keyword or date =======================
router.get("/:keyword", (req, res) => {
    const keyword = req.params.keyword;

    const sql = `
        SELECT * FROM event
        WHERE id = ? 
           OR name LIKE ? 
           OR status LIKE ? 
           OR location LIKE ? 
           OR description LIKE ? 
           OR date = ?
    `;
    const searchTerm = `%${keyword}%`;

    connection.query(sql, [keyword, searchTerm, searchTerm, searchTerm, searchTerm, keyword], (err, records) => {
        if (err) {
            console.error("Error while searching events: " + err);
            res.status(500).send({ error: "Database error" });
        } else {
            res.json(records);
        }
    });
});


// GET event details by ID
router.get("/details/:id", (req, res) => {
    const id = req.params.id;
    const sql = "SELECT * FROM event WHERE id = ?";

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching event details:", err);
            return res.status(500).json({ error: "Database error" });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        res.json(results[0]);
    });
});


// ======================= UPDATE event =======================
router.put("/", (req, res) => {
    const { id, name, category, location, date, time, description, image, ticket_price, goal_amount } = req.body;

    const sql = `UPDATE event SET name=?, category=?, location=?, date=?, time=?, description=?, image=?, ticket_price=?, goal_amount=? WHERE id=?`;
    connection.query(sql, [name, category, location, date, time, description, image, ticket_price, goal_amount, id], (err, result) => {
        if (err) {
            console.error("Error updating event:", err);
            res.status(500).send({ error: "Update failed" });
        } else {
            res.json({ message: "Event updated successfully" });
        }
    });
});
router.post("/", (req, res) => {
    const { name, category, location, date, time, description, image, ticket_price, goal_amount } = req.body;

    const sql = `INSERT INTO event (name, category, location, date, time, description, image, ticket_price, goal_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    connection.query(sql, [name, category, location, date, time, description, image, ticket_price, goal_amount], (err, result) => {
        if (err) {
            console.error("Error adding event:", err);
            res.status(500).send({ error: "Add event failed" });
        } else {
            res.json({ message: "Event added successfully", id: result.insertId });
        }
    });
});



// ======================= DELETE event =======================
router.delete("/:id", (req, res) => {
    connection.query("DELETE FROM event WHERE id=?", [req.params.id], (err, result) => {
        if (err) {
            console.error("Error while deleting data: " + err);
            res.status(500).send({ error: "Delete failed" });
        } else {
            res.json({ delete: "success" });
        }
    });
});

module.exports = router;

var dbcon = require("../event_db");
const path = require("path");

var connection = dbcon.getconnection();
connection.connect();

var express = require('express');
var router = express.Router();

// Check API is working
router.get("/test", (req, res) => {
    res.json({ message: "Registration API works" });
});

// Get all registrations
router.get("/", (req, res) => {
    connection.query("SELECT * FROM registration", (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json(results);
    });
});

// POST: Save a new registration
router.post("/", (req, res) => {
    const { name, email, event_id, event_date, ticket_price, donation } = req.body;

    if (!name || !email || !event_id || !event_date || !ticket_price) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const query = `
        INSERT INTO registration (name, email, event_id, event_date, ticket_price, donation)
        VALUES (?, ?, ?, ?, ?, ?)
    `;

    connection.query(query, [name, email, event_id, event_date, ticket_price, donation || 0], (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Database error" });
        }
        res.json({ message: "Registration successful", registrationId: result.insertId });
    });
});

module.exports = router;

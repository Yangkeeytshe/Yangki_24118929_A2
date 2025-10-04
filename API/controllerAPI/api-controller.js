var dbcon = require("../event_db");
const path = require("path");

var connection = dbcon.getconnection();
connection.connect();

var express = require('express');
var router = express.Router();

// GET all events
router.get("/", (req, res) => {
    connection.query("SELECT * FROM event", (err, records, fields) => {
        if (err) {
            console.error("Error while retrieving data:", err);
            return res.status(500).json({ error: "Database error" });
        }
        // Calculate progress percentage for each event
        const eventsWithProgress = records.map(event => ({
            ...event,
            progress_percentage: event.goal_amount > 0 
                ? (event.progress_amount / event.goal_amount) * 100 
                : 0
        }));
        res.json(eventsWithProgress);
    });
});

// Search by keyword - MUST come before /:id to avoid conflicts
router.get("/search/:keyword", (req, res) => {
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
            console.error("Error while searching events:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        // Calculate progress percentage for each event
        const eventsWithProgress = records.map(event => ({
            ...event,
            progress_percentage: event.goal_amount > 0 
                ? (event.progress_amount / event.goal_amount) * 100 
                : 0
        }));
        
        res.json(eventsWithProgress);
    });
});

// GET event by ID - comes after /search/:keyword
router.get("/:id", (req, res) => {
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
        
        // Calculate progress percentage
        const event = results[0];
        event.progress_percentage = event.goal_amount > 0 
            ? (event.progress_amount / event.goal_amount) * 100 
            : 0;
        
        res.json(event);
    });
});

// Update event
router.put("/:id", (req, res) => {
    const id = req.params.id;
    const { name, category, location, date, time, description, image, ticket_price, goal_amount, status } = req.body;

    const sql = `UPDATE event SET name=?, category=?, location=?, date=?, time=?, description=?, image=?, ticket_price=?, goal_amount=?, status=? WHERE id=?`;
    
    connection.query(sql, [name, category, location, date, time, description, image, ticket_price, goal_amount, status, id], (err, result) => {
        if (err) {
            console.error("Error updating event:", err);
            return res.status(500).json({ error: "Update failed" });
        }
        res.json({ message: "Event updated successfully", affectedRows: result.affectedRows });
    });
});

// Create new event
router.post("/", (req, res) => {
    const { name, category, location, date, time, description, image, ticket_price, goal_amount, status } = req.body;

    const sql = `INSERT INTO event (name, category, location, date, time, description, image, ticket_price, goal_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    connection.query(sql, [name, category, location, date, time, description, image, ticket_price, goal_amount, status || 'upcoming'], (err, result) => {
        if (err) {
            console.error("Error adding event:", err);
            return res.status(500).json({ error: "Add event failed" });
        }
        res.status(201).json({ message: "Event added successfully", id: result.insertId });
    });
});

// Delete event
router.delete("/:id", (req, res) => {
    connection.query("DELETE FROM event WHERE id=?", [req.params.id], (err, result) => {
        if (err) {
            console.error("Error while deleting data:", err);
            return res.status(500).json({ error: "Delete failed" });
        }
        res.json({ message: "Delete successful", affectedRows: result.affectedRows });
    });
});

module.exports = router;
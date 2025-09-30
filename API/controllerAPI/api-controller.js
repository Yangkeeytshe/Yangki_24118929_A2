const dbcon = require("../event_db");
const path = require("path");
const express = require('express');
const router = express.Router();

// Input validation helper
const validateEvent = (eventData) => {
    const errors = [];
    
    if (!eventData.name || eventData.name.trim().length === 0 || eventData.name.length > 255) {
        errors.push("Name is required and must be under 255 characters");
    }
    
    if (eventData.ticket_price && (isNaN(eventData.ticket_price) || eventData.ticket_price < 0)) {
        errors.push("Ticket price must be a positive number");
    }
    
    if (eventData.goal_amount && (isNaN(eventData.goal_amount) || eventData.goal_amount < 0)) {
        errors.push("Goal amount must be a positive number");
    }
    
    const validStatuses = ['upcoming', 'active', 'past'];
    if (eventData.status && !validStatuses.includes(eventData.status)) {
        errors.push("Status must be: upcoming, active, or past");
    }
    
    return errors;
};

// Sanitize input to prevent XSS
const sanitizeInput = (input) => {
    if (typeof input !== 'string') return input;
    return input.replace(/[<>]/g, '');
};

var connection = dbcon.getconnection();
connection.connect();

// GET all events
router.get("/", (req, res) => {
    connection.query("SELECT * FROM event", (err, records, fields) => {
        if (err) {
            console.error("Error while retrieving data:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        const eventsWithProgress = records.map(event => ({
            ...event,
            progress_percentage: event.goal_amount > 0 
                ? (event.progress_amount / event.goal_amount) * 100 
                : 0
        }));
        
        res.json(eventsWithProgress);
    });
});

// Search by keyword - Enhanced security
router.get("/search/:keyword", (req, res) => {
    const keyword = sanitizeInput(req.params.keyword);
    
    // Limit keyword length to prevent abuse
    if (keyword.length > 100) {
        return res.status(400).json({ error: "Search keyword too long" });
    }

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
        
        const eventsWithProgress = records.map(event => ({
            ...event,
            progress_percentage: event.goal_amount > 0 
                ? (event.progress_amount / event.goal_amount) * 100 
                : 0
        }));
        
        res.json(eventsWithProgress);
    });
});

// GET event by ID
router.get("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    // Validate ID is a number
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }
    
    const sql = "SELECT * FROM event WHERE id = ?";

    connection.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Error fetching event details:", err);
            return res.status(500).json({ error: "Database error" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        const event = results[0];
        event.progress_percentage = event.goal_amount > 0 
            ? (event.progress_amount / event.goal_amount) * 100 
            : 0;
        
        res.json(event);
    });
});

// Update event - with validation
router.put("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }
    
    // Sanitize inputs
    const eventData = {
        name: sanitizeInput(req.body.name),
        category: sanitizeInput(req.body.category),
        location: sanitizeInput(req.body.location),
        date: req.body.date,
        time: req.body.time,
        description: sanitizeInput(req.body.description),
        image: req.body.image,
        ticket_price: parseFloat(req.body.ticket_price) || 0,
        goal_amount: parseFloat(req.body.goal_amount) || 0,
        status: req.body.status
    };
    
    // Validate data
    const errors = validateEvent(eventData);
    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const sql = `UPDATE event SET name=?, category=?, location=?, date=?, time=?, description=?, image=?, ticket_price=?, goal_amount=?, status=? WHERE id=?`;
    
    connection.query(sql, [
        eventData.name, 
        eventData.category, 
        eventData.location, 
        eventData.date, 
        eventData.time, 
        eventData.description, 
        eventData.image, 
        eventData.ticket_price, 
        eventData.goal_amount, 
        eventData.status, 
        id
    ], (err, result) => {
        if (err) {
            console.error("Error updating event:", err);
            return res.status(500).json({ error: "Update failed" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        res.json({ message: "Event updated successfully", affectedRows: result.affectedRows });
    });
});

// Create new event - with validation
router.post("/", (req, res) => {
    // Sanitize inputs
    const eventData = {
        name: sanitizeInput(req.body.name),
        category: sanitizeInput(req.body.category),
        location: sanitizeInput(req.body.location),
        date: req.body.date,
        time: req.body.time,
        description: sanitizeInput(req.body.description),
        image: req.body.image,
        ticket_price: parseFloat(req.body.ticket_price) || 0,
        goal_amount: parseFloat(req.body.goal_amount) || 0,
        status: req.body.status || 'upcoming'
    };
    
    // Validate data
    const errors = validateEvent(eventData);
    if (errors.length > 0) {
        return res.status(400).json({ error: "Validation failed", details: errors });
    }

    const sql = `INSERT INTO event (name, category, location, date, time, description, image, ticket_price, goal_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    connection.query(sql, [
        eventData.name,
        eventData.category,
        eventData.location,
        eventData.date,
        eventData.time,
        eventData.description,
        eventData.image,
        eventData.ticket_price,
        eventData.goal_amount,
        eventData.status
    ], (err, result) => {
        if (err) {
            console.error("Error adding event:", err);
            return res.status(500).json({ error: "Add event failed" });
        }
        res.status(201).json({ message: "Event added successfully", id: result.insertId });
    });
});

// Delete event
router.delete("/:id", (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid event ID" });
    }
    
    connection.query("DELETE FROM event WHERE id=?", [id], (err, result) => {
        if (err) {
            console.error("Error while deleting data:", err);
            return res.status(500).json({ error: "Delete failed" });
        }
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Event not found" });
        }
        
        res.json({ message: "Delete successful", affectedRows: result.affectedRows });
    });
});

module.exports = router;
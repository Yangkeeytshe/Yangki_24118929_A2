const dbcon = require("../event_db");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express = require('express');

const connection = dbcon.getconnection();
connection.connect();

const router = express.Router();

const JWT_SECRET = 'yang2025';

// Admin login with secure password hashing
router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
    }

    const sql = "SELECT * FROM admin WHERE email = ?";
    
    connection.query(sql, [email], async (err, results) => {
        if (err) {
            console.error("Login error:", err);
            return res.status(500).json({ error: "Login failed" });
        }
        
        if (results.length === 0) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        const admin = results[0];
        
        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, admin.password);
        
        if (!passwordMatch) {
            return res.status(401).json({ error: "Invalid credentials" });
        }
        
        // Create JWT token
        const token = jwt.sign(
            { 
                id: admin.id, 
                email: admin.email,
                name: admin.name 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            message: "Login successful",
            token: token,
            admin: {
                id: admin.id,
                name: admin.name,
                email: admin.email
            }
        });
    });
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: "Access denied. No token provided." });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: "Invalid or expired token" });
        }
        req.user = user;
        next();
    });
}

// Verify token endpoint
router.get("/verify", authenticateToken, (req, res) => {
    res.json({ 
        success: true, 
        admin: req.user 
    });
});

// Logout endpoint
router.post("/logout", authenticateToken, (req, res) => {
    res.json({ success: true, message: "Logged out successfully" });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
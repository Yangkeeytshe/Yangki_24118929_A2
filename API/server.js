const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const eventAPI = require("./controllerAPI/api-controller");
const registerAPI = require("./controllerAPI/register-api-controller");
const adminAPI = require("./controllerAPI/admin-api-controller");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files - go UP one level to find client folder
app.use(express.static(path.join(__dirname, "..", "client")));

// Serve images
app.get("/images/:imageName", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "images", req.params.imageName));
});

// Serve HTML pages - all paths go UP one level
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "index.html"));
});

app.get("/events", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "event.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "register.html"));
});

app.get("/search", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "search.html"));
});

app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "admin.html"));
});
app.get("/admin-dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "admin-dashboard.html"));
});
app.get("/event-detail", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "client", "event-detail.html"));
});

// API routes
app.use("/api/events", eventAPI);
app.use("/api/register", registerAPI);
app.use("/api/admin", adminAPI);

app.listen(3060, () => {
    console.log("Server running at http://localhost:3060");
});
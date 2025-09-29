const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const eventAPI = require("./API/controllerAPI/api-controller");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Serve static files
app.use(express.static(path.join(__dirname, "client")));

// Serve images
app.get("/images/:imageName", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "images", req.params.imageName));
});

// Serve HTML pages
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "index.html"));
});
app.get("/events", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "event.html")); // <-- new events page
});
app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "register.html"));
});
app.get("/search", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "search.html"));
});

// API routes
app.use("/api/events", eventAPI);

app.listen(3060, () => {
    console.log("✅ Server running at http://localhost:3060");
});

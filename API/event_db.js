var dbDetails = require("./db-details");
var mysql = require('mysql2');

module.exports = {
    getconnection: () => {
        const connection = mysql.createConnection({
            host: dbDetails.host,
            user: dbDetails.user,
            password: dbDetails.password,
            database: dbDetails.database
        });

        connection.connect(err => {
            if (err) {
                console.error(" Database connection failed:", err.message);
            } else {
                console.log(" Database connected successfully!");
            }
        });

        return connection;
    }
}

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

        return connection;
    }
}

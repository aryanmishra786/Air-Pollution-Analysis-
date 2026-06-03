const mysql = require('mysql2/promise');



// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "", // your MySQL password
//   database: "aqi_db"
// });

// db.connect(err => {
//   if (err) throw err;
//   console.log("✅ Connected to MySQL database");
// });
const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'aqi_db',
});

module.exports = db;

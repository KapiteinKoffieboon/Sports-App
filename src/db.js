const sqlite3 = require('sqlite3').verbose();

// maakt (of opent) database bestand
const db = new sqlite3.Database('./database.db', (err) => {
  if (err) {
    console.error('Error connecting to database', err);
  } else {
    console.log('Connected to SQLite database');
  }
});

// maak tabel als die nog niet bestaat
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    password TEXT,
    role TEXT
  )
`);

module.exports = db;

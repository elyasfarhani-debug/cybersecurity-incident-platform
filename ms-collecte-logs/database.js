const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Création ou ouverture de la base de données locale
const dbPath = path.resolve(__dirname, 'logs.db');
const db = new sqlite3.Database(dbPath);

// Initialisation de la table des logs
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_ip TEXT,
        event_type TEXT,
        severity TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

module.exports = db;

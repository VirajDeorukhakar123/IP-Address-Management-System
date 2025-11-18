const express = require('express');
const mysql = require('mysql2');
const path = require('path'); // Import the 'path' module
const app = express();
const port = 3000;
const dotenv = require("dotenv");
dotenv.config();

    

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to the database: ' + err.stack);
        return;
    }
    console.log('Connected to database as id ' + db.threadId);
});

// Define the absolute path to the frontend folder
// The '__dirname' variable now points to the 'backend' folder,
// so we go up one directory and then into 'frontend'.
const frontendPath = path.join(__dirname, '../frontend');

// Serve the home page
app.get('/', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
});

// Serve the add IP page
app.get('/add', (req, res) => {
    res.sendFile(path.join(frontendPath, 'add.html'));
});

// Serve the edit IP page
app.get('/edit', (req, res) => {
    res.sendFile(path.join(frontendPath, 'edit.html'));
});

// Serve the generate list page
app.get('/list', (req, res) => {
    res.sendFile(path.join(frontendPath, 'list.html'));
});

// API Routes for IP Addresses

// GET IP addresses with optional filtering (Read)
app.get('/api/ips', (req, res) => {
    const { location, department_name, room_number } = req.query;
    let sql = 'SELECT * FROM ip_addresses';
    let queryParams = [];
    let conditions = [];

    if (location) {
        conditions.push('location = ?');
        queryParams.push(location);
    }
    if (department_name) {
        conditions.push('department_name = ?');
        queryParams.push(department_name);
    }
    if (room_number) {
        conditions.push('room_number = ?');
        queryParams.push(room_number);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY id DESC';

    db.query(sql, queryParams, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// POST a new IP address (Create)
app.post('/api/ips', (req, res) => {
    let { location, department_name, ip_3_octets, ip_4_octet, room_number } = req.body;

    // Check for an empty string for room_number and set to null if needed
    if (room_number === '') {
        room_number = null;
    }

    // First, check if the IP address already exists
    const checkSql = 'SELECT id FROM ip_addresses WHERE ip_3_octets = ? AND ip_4_octet = ?';
    db.query(checkSql, [ip_3_octets, ip_4_octet], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        
        // If results are found, the IP already exists
        if (results.length > 0) {
            return res.status(409).json({ message: 'This IP address already exists.' });
        }

        // If no duplicates found, proceed with insertion
        const insertSql = 'INSERT INTO ip_addresses (location, department_name, ip_3_octets, ip_4_octet, room_number) VALUES (?, ?, ?, ?, ?)';
        db.query(insertSql, [location, department_name, ip_3_octets, ip_4_octet, room_number], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(201).json({ id: result.insertId, location, department_name, ip_3_octets, ip_4_octet, room_number });
        });
    });
});

// PUT to update an IP address (Update)
app.put('/api/ips/:id', (req, res) => {
    const { id } = req.params;
    const { ip_3_octets, ip_4_octet, room_number } = req.body;

    // Check if the new IP address already exists in another record
    const checkSql = 'SELECT id FROM ip_addresses WHERE ip_3_octets = ? AND ip_4_octet = ? AND id != ?';
    db.query(checkSql, [ip_3_octets, ip_4_octet, id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }

        if (results.length > 0) {
            return res.status(409).json({ message: 'This IP address already exists for another record.' });
        }
        
        // If no duplicate is found, proceed with the update
        const updateSql = 'UPDATE ip_addresses SET ip_3_octets = ?, ip_4_octet = ?, room_number = ? WHERE id = ?';
        db.query(updateSql, [ip_3_octets, ip_4_octet, room_number, id], (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.status(200).json({ message: 'IP address updated successfully' });
        });
    });
});

// DELETE an IP address (Delete)
app.delete('/api/ips/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM ip_addresses WHERE id = ?';
    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).json({ message: 'IP address deleted successfully' });
    });
});

// API route to get all IPs, grouped by location
app.get('/api/list', (req, res) => {
    const sql = 'SELECT * FROM ip_addresses ORDER BY location, ip_4_octet';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }

        // Group the results by location
        const groupedByLocation = results.reduce((acc, currentIp) => {
            const locationName = currentIp.location;
            if (!acc[locationName]) {
                acc[locationName] = [];
            }
            acc[locationName].push(currentIp);
            return acc;
        }, {});

        res.json(groupedByLocation);
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
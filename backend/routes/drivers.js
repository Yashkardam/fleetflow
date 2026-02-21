const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all drivers
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM drivers ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching drivers' });
    }
});

// POST: Add a new driver (Compliance)
router.post('/', async (req, res) => {
    const { name, license_expiry } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO drivers (name, license_expiry, safety_score, status) 
             VALUES ($1, $2, 100, 'On Duty') RETURNING *`,
            [name, license_expiry]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while adding driver' });
    }
});

module.exports = router;
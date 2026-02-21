// backend/routes/fuel.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all fuel logs
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT f.id, v.name AS vehicle_name, f.liters, f.cost, f.log_date
            FROM fuel_logs f
            JOIN vehicles v ON f.vehicle_id = v.id
            ORDER BY f.log_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching fuel logs' });
    }
});

// POST: Add a new fuel log
router.post('/', async (req, res) => {
    const { vehicle_id, liters, cost, log_date } = req.body;

    try {
        const result = await db.query(
            `INSERT INTO fuel_logs (vehicle_id, liters, cost, log_date) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [vehicle_id, liters, cost, log_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error logging fuel' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all vehicles
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM vehicles ORDER BY id ASC');
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching vehicles' });
    }
});

// POST: Add a new vehicle (Vehicle Intake)
router.post('/', async (req, res) => {
    const { name, license_plate, max_capacity_kg } = req.body;
    
    try {
        const result = await db.query(
            `INSERT INTO vehicles (name, license_plate, max_capacity_kg, status, odometer) 
             VALUES ($1, $2, $3, 'Available', 0) RETURNING *`,
            [name, license_plate, max_capacity_kg]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while adding vehicle' });
    }
});

module.exports = router;
// backend/routes/maintenance.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all maintenance logs with the vehicle's name
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT m.id, v.name AS vehicle_name, m.service_type, m.cost, m.service_date
            FROM maintenance_logs m
            JOIN vehicles v ON m.vehicle_id = v.id
            ORDER BY m.service_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching maintenance logs' });
    }
});

// POST: Log maintenance and update vehicle status
router.post('/', async (req, res) => {
    const { vehicle_id, service_type, cost, service_date } = req.body;

    try {
        // --- NEW VALIDATION ---
        const vehicleCheck = await db.query('SELECT status FROM vehicles WHERE id = $1', [vehicle_id]);
        if (vehicleCheck.rows[0].status === 'On Trip') {
            return res.status(400).json({ 
                error: 'Cannot service a vehicle that is currently On Trip. Complete or Cancel the trip first.' 
            });
        }
        // ----------------------

        const logRes = await db.query(
            `INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [vehicle_id, service_type, cost, service_date]
        );

        await db.query(`UPDATE vehicles SET status = 'In Shop' WHERE id = $1`, [vehicle_id]);

        res.status(201).json(logRes.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error logging maintenance' });
    }
});

module.exports = router;
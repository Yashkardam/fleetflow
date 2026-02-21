const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all logs with vehicle names
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT m.*, v.name as vehicle_name 
            FROM maintenance_logs m
            JOIN vehicles v ON m.vehicle_id = v.id
            ORDER BY m.service_date DESC;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching logs.' });
    }
});

// POST: Create New Service Log & Auto-Switch Vehicle Status
router.post('/', async (req, res) => {
    const { vehicle_id, service_type, cost, service_date } = req.body;

    try {
        // 1. Create the Maintenance Log
        const logRes = await db.query(
            'INSERT INTO maintenance_logs (vehicle_id, service_type, cost, service_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [vehicle_id, service_type, cost, service_date]
        );

        // 2. LOGIC LINK: Automatically switch vehicle status to 'In Shop'
        await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['In Shop', vehicle_id]);

        res.status(201).json(logRes.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error logging maintenance.' });
    }
});

// PUT: Complete Service Log & Release Vehicle
router.put('/:id/complete', async (req, res) => {
    const { id } = req.params;

    try {
        // 1. Find the vehicle linked to this log
        const logRes = await db.query('SELECT vehicle_id FROM maintenance_logs WHERE id = $1', [id]);
        if (logRes.rows.length === 0) return res.status(404).json({ error: 'Log not found.' });
        
        const vehicle_id = logRes.rows[0].vehicle_id;

        // 2. Mark the maintenance log as 'Completed'
        await db.query('UPDATE maintenance_logs SET status = $1 WHERE id = $2', ['Completed', id]);

        // 3. Update vehicle back to 'Available'
        await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['Available', vehicle_id]);

        res.json({ message: 'Service completed. Vehicle is now Available.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error completing service.' });
    }
});

module.exports = router;
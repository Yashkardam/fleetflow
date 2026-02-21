const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all expense logs with Driver and Trip details
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT e.*, t.driver_id, d.name as driver_name, t.status as trip_status
            FROM trip_expenses e
            JOIN trips t ON e.trip_id = t.id
            JOIN drivers d ON t.driver_id = d.id
            ORDER BY e.logged_at DESC;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching expenses.' });
    }
});

// POST: Add New Expense & Mark Trip as 'Completed'
router.post('/', async (req, res) => {
    const { trip_id, fuel_cost, misc_cost, distance_km } = req.body;
    try {
        // 1. Log the expense
        const expenseRes = await db.query(
            'INSERT INTO trip_expenses (trip_id, fuel_cost, misc_cost, distance_km) VALUES ($1, $2, $3, $4) RETURNING *',
            [trip_id, fuel_cost, misc_cost, distance_km]
        );

        // 2. Mark Trip as Completed and free the vehicle
        const tripRes = await db.query('SELECT vehicle_id FROM trips WHERE id = $1', [trip_id]);
        const vehicle_id = tripRes.rows[0].vehicle_id;

        await db.query('UPDATE trips SET status = $1 WHERE id = $2', ['Completed', trip_id]);
        await db.query('UPDATE vehicles SET status = $1, odometer = odometer + $2 WHERE id = $3', ['Available', distance_km, vehicle_id]);

        res.status(201).json(expenseRes.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Server error logging expense.' });
    }
});

module.exports = router;
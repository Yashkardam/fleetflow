const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all trips with driver and vehicle names
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT t.*, v.name as vehicle_name, v.max_capacity_kg, d.name as driver_name 
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            JOIN drivers d ON t.driver_id = d.id
            ORDER BY t.created_at DESC;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: 'Server error fetching trips.' });
    }
});

// POST: Create a new Trip (Draft or Dispatched)
router.post('/', async (req, res) => {
    // 1. Destructure the new fields from req.body
    const { vehicle_id, driver_id, cargo_weight, status, origin_address, destination_address, estimated_fuel_cost } = req.body; 

    try {
        const vehicleRes = await db.query('SELECT max_capacity_kg FROM vehicles WHERE id = $1', [vehicle_id]);
        if (vehicleRes.rows.length === 0) return res.status(404).json({ error: 'Vehicle not found.' });
        
        if (Number(cargo_weight) > Number(vehicleRes.rows[0].max_capacity_kg)) {
            return res.status(400).json({ error: `VALIDATION BLOCKED: Cargo weight (${cargo_weight}kg) exceeds vehicle max capacity (${vehicleRes.rows[0].max_capacity_kg}kg).` });
        }

        const driverRes = await db.query('SELECT license_expiry FROM drivers WHERE id = $1', [driver_id]);
        if (new Date(driverRes.rows[0].license_expiry) < new Date()) {
            return res.status(400).json({ error: 'COMPLIANCE BLOCKED: Driver license is expired.' });
        }

        // 2. Insert the Trip including the new fields
        const { rows } = await db.query(
            `INSERT INTO trips 
            (vehicle_id, driver_id, cargo_weight, status, origin_address, destination_address, estimated_fuel_cost) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [vehicle_id, driver_id, cargo_weight, status, origin_address, destination_address, estimated_fuel_cost || 0]
        );

        if (status === 'Dispatched') {
            await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['On Trip', vehicle_id]);
        }

        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error creating trip.' });
    }
});

// PUT: Lifecycle Management (Update Status)
router.put('/:id/lifecycle', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // Target status: 'Dispatched', 'Cancelled', etc.

    try {
        const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
        if (tripRes.rows.length === 0) return res.status(404).json({ error: 'Trip not found.' });
        const trip = tripRes.rows[0];

        // Update the trip status
        await db.query('UPDATE trips SET status = $1 WHERE id = $2', [status, id]);

        // Lifecycle Actions: Lock or unlock the vehicle
        if (status === 'Dispatched') {
            await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['On Trip', trip.vehicle_id]);
        } else if (status === 'Cancelled' && trip.status === 'Dispatched') {
            // Free up the vehicle if a dispatched trip is cancelled
            await db.query('UPDATE vehicles SET status = $1 WHERE id = $2', ['Available', trip.vehicle_id]);
        }

        res.json({ message: `Trip status updated to ${status}` });
    } catch (err) {
        res.status(500).json({ error: 'Server error updating trip lifecycle.' });
    }
});

// PUT: Complete Trip (Already used by Page 6, keeping it here for completeness)
router.put('/:id/complete', async (req, res) => {
    const { id } = req.params;
    const { final_odometer } = req.body;
    try {
        const tripRes = await db.query('SELECT vehicle_id FROM trips WHERE id = $1', [id]);
        const vehicle_id = tripRes.rows[0].vehicle_id;
        
        await db.query('UPDATE trips SET status = $1 WHERE id = $2', ['Completed', id]);
        await db.query('UPDATE vehicles SET status = $1, odometer = $2 WHERE id = $3', ['Available', final_odometer, vehicle_id]);
        res.json({ message: 'Trip completed.' });
    } catch (err) {
        res.status(500).json({ error: 'Server error completing trip.' });
    }
});

module.exports = router;
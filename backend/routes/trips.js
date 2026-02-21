const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all trips with linked Vehicle and Driver names
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT t.id, v.name AS vehicle_name, d.name AS driver_name, 
                   t.cargo_weight, t.status, t.created_at
            FROM trips t
            JOIN vehicles v ON t.vehicle_id = v.id
            JOIN drivers d ON t.driver_id = d.id
            ORDER BY t.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error while fetching trips' });
    }
});

// POST: Create a new trip (The Dispatch Workflow)
router.post('/', async (req, res) => {
    const { vehicle_id, driver_id, cargo_weight } = req.body;

    try {
        const vehicleRes = await db.query('SELECT max_capacity_kg, status FROM vehicles WHERE id = $1', [vehicle_id]);
        const driverRes = await db.query('SELECT license_expiry, status FROM drivers WHERE id = $1', [driver_id]);

        if (vehicleRes.rows.length === 0 || driverRes.rows.length === 0) {
            return res.status(404).json({ error: 'Vehicle or Driver not found.' });
        }

        const vehicle = vehicleRes.rows[0];
        const driver = driverRes.rows[0];

        // Validation Rules
        if (Number(cargo_weight) > Number(vehicle.max_capacity_kg)) {
            return res.status(400).json({ error: 'Trip blocked: Cargo weight exceeds vehicle capacity.' });
        }
        if (new Date(driver.license_expiry) < new Date()) {
            return res.status(400).json({ error: 'Trip blocked: Driver license is expired.' });
        }
        if (vehicle.status !== 'Available' || driver.status !== 'On Duty') {
            return res.status(400).json({ error: 'Vehicle or Driver is not currently available.' });
        }

        // Create the trip and update statuses
        const tripRes = await db.query(
            `INSERT INTO trips (vehicle_id, driver_id, cargo_weight, status) 
             VALUES ($1, $2, $3, 'Dispatched') RETURNING *`,
            [vehicle_id, driver_id, cargo_weight]
        );

        await db.query(`UPDATE vehicles SET status = 'On Trip' WHERE id = $1`, [vehicle_id]);
        await db.query(`UPDATE drivers SET status = 'On Trip' WHERE id = $1`, [driver_id]);

        res.status(201).json(tripRes.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during dispatch' });
    }
});

// PUT: Complete a trip and free up the assets
router.put('/:id/complete', async (req, res) => {
    const tripId = req.params.id;
    const { final_odometer } = req.body;

    try {
        // 1. Find the trip to get the vehicle and driver IDs
        const tripRes = await db.query('SELECT vehicle_id, driver_id, status FROM trips WHERE id = $1', [tripId]);
        if (tripRes.rows.length === 0) {
            return res.status(404).json({ error: 'Trip not found.' });
        }

        const trip = tripRes.rows[0];
        if (trip.status !== 'Dispatched') {
            return res.status(400).json({ error: 'Only dispatched trips can be completed.' });
        }

        // 2. Mark the trip as Completed
        await db.query(`UPDATE trips SET status = 'Completed' WHERE id = $1`, [tripId]);

        // 3. Update the Vehicle: Status becomes Available, and Odometer updates
        await db.query(`UPDATE vehicles SET status = 'Available', odometer = $1 WHERE id = $2`, 
            [final_odometer, trip.vehicle_id]
        );

        // 4. Update the Driver: Status becomes On Duty
        await db.query(`UPDATE drivers SET status = 'On Duty' WHERE id = $1`, [trip.driver_id]);

        res.json({ message: 'Trip completed successfully!' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error completing trip.' });
    }
});




module.exports = router;
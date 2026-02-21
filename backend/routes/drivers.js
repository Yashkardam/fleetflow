const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch all drivers with calculated Trip Completion Rates
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                d.*,
                COUNT(t.id) as total_trips,
                SUM(CASE WHEN t.status = 'Completed' THEN 1 ELSE 0 END) as completed_trips
            FROM drivers d
            LEFT JOIN trips t ON d.id = t.driver_id
            GROUP BY d.id
            ORDER BY d.id ASC;
        `;
        const { rows } = await db.query(query);
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error fetching drivers.' });
    }
});

// POST: Add a new driver
router.post('/', async (req, res) => {
    const { name, license_expiry } = req.body;
    try {
        const { rows } = await db.query(
            'INSERT INTO drivers (name, license_expiry) VALUES ($1, $2) RETURNING *',
            [name, license_expiry]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error adding driver.' });
    }
});

// PUT: Change Driver Status (On Duty, Off Duty, Suspended)
router.put('/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['On Duty', 'Off Duty', 'Suspended'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status.' });
    }

    try {
        await db.query('UPDATE drivers SET status = $1 WHERE id = $2', [status, id]);
        res.json({ message: `Driver status updated to ${status}.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error updating driver status.' });
    }
});

module.exports = router;
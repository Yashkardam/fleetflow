// backend/routes/analytics.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// GET: Fetch Operational Analytics for all vehicles
router.get('/roi', async (req, res) => {
    try {
        // We use a powerful SQL query with subqueries to aggregate data per vehicle
        const query = `
            SELECT 
                v.id,
                v.name,
                v.odometer,
                v.acquisition_cost,
                COALESCE((SELECT SUM(revenue) FROM trips WHERE vehicle_id = v.id AND status = 'Completed'), 0) AS total_revenue,
                COALESCE((SELECT SUM(cost) FROM maintenance_logs WHERE vehicle_id = v.id), 0) AS total_maintenance,
                COALESCE((SELECT SUM(cost) FROM fuel_logs WHERE vehicle_id = v.id), 0) AS total_fuel,
                COALESCE((SELECT SUM(liters) FROM fuel_logs WHERE vehicle_id = v.id), 0) AS total_liters
            FROM vehicles v
            WHERE v.status != 'Retired'
        `;
        
        const { rows } = await db.query(query);
        
        // Process the math for the metrics [cite: 44, 45, 57]
        const analyticsReport = rows.map(v => {
            const revenue = Number(v.total_revenue);
            const maintenance = Number(v.total_maintenance);
            const fuel = Number(v.total_fuel);
            const acquisition = Number(v.acquisition_cost) || 1; // fallback to avoid dividing by zero
            const liters = Number(v.total_liters);
            const odometer = Number(v.odometer);

            // The Math Calculations
            const totalCost = maintenance + fuel;
            const roiRaw = (revenue - totalCost) / acquisition; 
            const roiPercentage = (roiRaw * 100).toFixed(2);
            
            const costPerKm = odometer > 0 ? (totalCost / odometer).toFixed(2) : "0.00";
            const fuelEfficiency = liters > 0 ? (odometer / liters).toFixed(2) : "0.00";

            return {
                vehicle_id: v.id,
                name: v.name,
                total_revenue: revenue,
                total_operational_cost: totalCost,
                roi_percentage: roiPercentage,
                cost_per_km: costPerKm,
                fuel_efficiency_km_l: fuelEfficiency
            };
        });
        
        res.json(analyticsReport);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error generating analytics.' });
    }
});

module.exports = router;
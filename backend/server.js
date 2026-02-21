const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// --- NEW: Import and use routes ---
const vehicleRoutes = require('./routes/vehicles');
const driverRoutes = require('./routes/drivers');
const tripRoutes = require('./routes/trips');
const maintenanceRoutes = require('./routes/maintenance');
const fuelRoutes = require('./routes/fuel');
const analyticsRoutes = require('./routes/analytics');
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
// ----------------------------------

app.get('/api/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ status: 'API is running', db_time: result.rows[0].now });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Database connection error');
    }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
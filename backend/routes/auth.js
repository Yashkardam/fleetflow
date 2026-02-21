// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fleetflow_key_123';

// POST: Register a new user
router.post('/register', async (req, res) => {
    // Only accept Manager or Dispatcher
    const { email, password, role } = req.body;

    if (role !== 'Manager' && role !== 'Dispatcher') {
        return res.status(400).json({ error: 'Invalid role. Must be Manager or Dispatcher.' });
    }

    try {
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'User with this email already exists.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await db.query(`
            INSERT INTO users (email, password_hash, role) 
            VALUES ($1, $2, $3) RETURNING id, email, role;
        `, [email, hashedPassword, role]);

        res.status(201).json({ message: 'User registered successfully!', user: newUser.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during registration.' });
    }
});

// POST: Login Route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const user = userRes.rows[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        res.json({ token, role: user.role, email: user.email });

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error during login.' });
    }
});

module.exports = router;
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const nodemailer = require('nodemailer');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fleetflow_key_123';

// Configure the Email Transporter (Make sure your .env has EMAIL_USER and EMAIL_PASS)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// POST: Register a new user (Manager or Dispatcher)
router.post('/register', async (req, res) => {
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

// POST: Request Password Reset (Sends REAL Email)
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.json({ message: 'If that email exists, a reset link has been sent.' });
        }

        const user = userRes.rows[0];
        const resetToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '15m' });
        const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: `"FleetFlow Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'FleetFlow - Password Reset Request',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #0077b6;">FleetFlow Command Center</h2>
                    <p>Hello,</p>
                    <p>We received a request to reset your password. Click the button below to create a new one. This link will expire in 15 minutes.</p>
                    <a href="${resetLink}" style="background-color: #0077b6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">Reset My Password</a>
                    <p>If you did not request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #ccc; margin-top: 20px;" />
                    <p style="font-size: 12px; color: #888;">FleetFlow Automated System</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error("Email Error:", err.message);
        res.status(500).json({ error: 'Server error during password reset request.' });
    }
});

// POST: Reset Password (Verifies token and saves new password)
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        // 1. Verify the token is valid
        const decoded = jwt.verify(token, JWT_SECRET);

        // 2. Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update the database
        await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hashedPassword, decoded.id]);

        res.json({ message: 'Password has been reset successfully! You can now log in.' });
    } catch (err) {
        // If jwt.verify fails, it falls into this catch block
        console.error("Reset Token Error:", err.message);
        return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
    }
});

module.exports = router;
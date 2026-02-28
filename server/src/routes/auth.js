const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

/**
 * A. User Registration (Password Hashing)
 */
router.post('/register', async (req, res) => {
    const { full_name, email, password, role } = req.body;
    console.log('Registering user:', { full_name, email, role });

    try {
        // Security Lead: Check if user exists
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length > 0) {
            console.log('Registration failed: User already exists');
            return res.status(400).json({ message: 'User already exists' });
        }

        // Security Lead: Hash password with salt
        const saltRounds = 10;
        const salt = await bcrypt.genSalt(saltRounds);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Save hashedPassword to DB
        const newUser = await db.query(
            'INSERT INTO users (full_name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
            [full_name, email, hashedPassword, role || 'student']
        );

        // Generate token for the new user so they are logged in immediately
        const token = jwt.sign(
            { id: newUser.rows[0].id, role: newUser.rows[0].role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        console.log('User registered successfully:', newUser.rows[0]);
        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser.rows[0],
        });
    } catch (err) {
        console.error('DATABASE ERROR DURING REGISTRATION:', err.message);
        res.status(500).json({ message: `Database error: ${err.message}` });
    }
});

/**
 * B. User Login (JWT Generation)
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ message: 'Invalid Token' }); // Masking for security
        }

        // Verify hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid Token' });
        }

        // Security Lead: Embed id and role into token
        const token = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login Error:', err.message);
        res.status(500).json({ message: `Database error: ${err.message}` });
    }
});

module.exports = router;

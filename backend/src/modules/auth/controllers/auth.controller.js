const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authModel = require('../models/auth.model');

/**
 * Handle user registration
 */
const register = async (req, res) => {
    const { full_name, email, password, role } = req.body;

    if (!full_name || !email || !password) {
        return res.status(400).json({ message: 'full_name, email, and password are required' });
    }

    try {
        const existing = await authModel.findByEmail(email);
        if (existing) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await authModel.createUser({
            full_name,
            email,
            password: hashedPassword,
            role
        });

        const token = jwt.sign(
            { id: newUser.id, role: newUser.role },
            process.env.JWT_SECRET,
            { expiresIn: '2h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: newUser,
        });
    } catch (err) {
        console.error('Registration error:', err.message);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

/**
 * Handle user login
 */
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    try {
        const user = await authModel.findByEmail(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

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
                full_name: user.full_name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (err) {
        console.error('Login error:', err.message);
        res.status(500).json({ message: 'Server error during login' });
    }
};

module.exports = {
    register,
    login
};

import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// POST: /api/auth/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase().trim() });
    if (userExists) {
      return res.status(400).json({ message: 'Yeh email pehle se registered hai' });
    }

    // Security: Only allow worker and customer roles during public registration.
    // Admin accounts require valid admin authorization credentials or must be initial seed.
    let assignedRole = 'worker';
    if (role === 'customer') {
      assignedRole = 'customer';
    } else if (role === 'admin') {
      const totalUsers = await User.countDocuments();
      const secret = req.body.adminSecret || req.headers['x-admin-secret'];
      const expectedSecret = process.env.ADMIN_REGISTRATION_SECRET || 'dlm_admin_secret_2026';

      if (totalUsers === 0 || (secret && secret === expectedSecret)) {
        assignedRole = 'admin';
      } else {
        return res.status(403).json({
          message: 'Unauthorized: Admin registration is restricted. Please provide valid administrative authorization credentials.',
        });
      }
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone.trim(),
      role: assignedRole,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST: /api/auth/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(401).json({ message: 'Email ya password ghalat hai' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET: /api/auth/me (Logged-in user ki details)
export const getMe = async (req, res) => {
  res.json(req.user);
};

import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. Check karna ke kya token valid hai aur user DB mein mojood hai
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User account mojood nahi hai, dobara login karein' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Token invalid ya expire ho chuka hai' });
    }
  }

  return res.status(401).json({ message: 'Aap login nahi hain, token missing hai' });
};

// 2. Role Check karna (Worker, Customer, Admin)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Role [${req.user?.role || 'unknown'}] ko is action ki ijazat nahi hai.`,
      });
    }
    next();
  };
};
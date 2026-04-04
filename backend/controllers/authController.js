const prisma = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

exports.registerUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: email === 'umeshtejas2004@gmail.com' ? 'ADMIN' : 'DRIVER'
      }
    });

    const payload = {
      user: { id: user.id }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.loginUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Usually skip checking password if Supabase is strictly used 
    // but preserving for backwards compatibility in existing backend
    const isMatch = user.password ? await bcrypt.compare(password, user.password) : false;

    if (!isMatch && user.password) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: { id: user.id }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

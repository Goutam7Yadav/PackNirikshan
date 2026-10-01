const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const authRoutes = require('./routes/auth');

const {
  authenticateToken,
  authorizeRole
} = require('./middleware/auth');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', authRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend running with MySQL!' });
});

app.get(
  '/api/protected',
  authenticateToken,
  (req, res) => {

    res.json({
      message: 'You accessed a protected route!',
      user: req.user
    });

  }
);

app.get(
  '/api/admin',
  authenticateToken,
  authorizeRole('Admin'),
  (req, res) => {

    res.json({
      message: 'Welcome Admin!',
      user: req.user
    });

  }
);

app.get(
  '/api/inspector',
  authenticateToken,
  authorizeRole('Inspector'),
  (req, res) => {

    res.json({
      message: 'Welcome Inspector!',
      user: req.user
    });

  }
);

// Example: fetch all users
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).send(err);
    res.json(results);
  });
});

app.listen(5000, () => console.log('🚀 Server running on port 5000'));

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();


// ==========================================
// REGISTER
// ==========================================

router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Check required fields
    if (!username || !email || !password || !role) {
      return res.status(400).json({
        message: 'Username, email, password and role are required'
      });
    }

    // Validate role
    if (!['Admin', 'Inspector'].includes(role)) {
      return res.status(400).json({
        message: 'Role must be either Admin or Inspector'
      });
    }

    // Check if username already exists
    db.query(
      'SELECT id FROM users WHERE username = ?',
      [username],
      async (err, usernameResults) => {

        if (err) {
          console.error('Username check error:', err);

          return res.status(500).json({
            message: 'Database error'
          });
        }

        if (usernameResults.length > 0) {
          return res.status(409).json({
            message: 'Username already exists'
          });
        }


        // Check if email already exists
        db.query(
          'SELECT id FROM users WHERE email = ?',
          [email],
          async (err, emailResults) => {

            if (err) {
              console.error('Email check error:', err);

              return res.status(500).json({
                message: 'Database error'
              });
            }

            if (emailResults.length > 0) {
              return res.status(409).json({
                message: 'Email already registered'
              });
            }


            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);


            // Insert user into database
            db.query(
              `INSERT INTO users
              (username, email, password, role)
              VALUES (?, ?, ?, ?)`,
              [username, email, hashedPassword, role],

              (err, result) => {

                if (err) {
                  console.error('Registration error:', err);

                  return res.status(500).json({
                    message: 'Failed to register user'
                  });
                }


                return res.status(201).json({
                  message: 'User registered successfully',
                  userId: result.insertId
                });

              }
            );

          }
        );

      }
    );

  } catch (error) {

    console.error('Register server error:', error);

    return res.status(500).json({
      message: 'Internal server error'
    });

  }
});



// ==========================================
// LOGIN
// ==========================================

router.post('/login', (req, res) => {

  const { email, password } = req.body;


  // Check required fields
  if (!email || !password) {
    return res.status(400).json({
      message: 'Email and password are required'
    });
  }


  // Find user by email
  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],

    async (err, results) => {

      if (err) {
        console.error('Login database error:', err);

        return res.status(500).json({
          message: 'Database error'
        });
      }


      // User not found
      if (results.length === 0) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }


      const user = results[0];


      // Compare password
      const passwordMatch = await bcrypt.compare(
        password,
        user.password
      );


      if (!passwordMatch) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }


      // Create JWT token
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },

        process.env.JWT_SECRET,

        {
          expiresIn: '1d'
        }
      );


      // Login successful
      return res.status(200).json({

        message: 'Login successful',

        token: token,

        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }

      });

    }
  );

});



module.exports = router;
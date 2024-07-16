const { body, validationResult } = require('express-validator');
const express = require('express');
const Users = require('../models/Users');
const router = express.Router();

// Route 1: Create a User using POST: /api/auth/createuser. No Login requirerd.
router.post(
  '/create_user',
  [
    // firstName must not be empty.
    body('firstName', 'FirstName cannot be empty').notEmpty(),
    // lastName must not be empty.
    body('lastName', 'LastName cannot be empty').notEmpty(),
    // email must be an email and not empty.
    body('email')
      .notEmpty()
      .withMessage('Email cannot be empty')
      .isEmail()
      .withMessage('Please enter a valid email'),
    // password must be at least 6 chars long and not empty.
    body('password')
      .notEmpty()
      .withMessage('Password cannot be empty')
      .isLength({ min: 6 })
      .withMessage('Password must be atleast of 5 characters'),
    // password must match with password and not empty.
    body('confirmPassword')
      .notEmpty()
      .withMessage('Password cannot be empty')
      .custom((value, { req }) => {
        return value === req.body.password;
      })
      .withMessage("Password doesn't matches"),
  ],
  async (request, response) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    try {
      let isValid = false;
      // Check if the email exists in database.
      let user = await Users.findOne({ email: request.body.email });
      if (user) {
        return response.status(400).json({
          isValid,
          error:
            'User with this email already exists. Please enter an unique email',
        });
      } else {
        // If email doesn't exists then the below code will run
        isValid = true;
        user = await Users.create({
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          email: request.body.email,
          password: request.body.password,
          confirmPassword: request.body.confirmPassword,
        });
      }
      response.json({ isValid, user });
    } catch (error) {
      return response.status(400).send({ error: error.message });
    }
  }
);

module.exports = router;

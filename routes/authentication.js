const { body, validationResult } = require('express-validator');
const express = require('express');
const Users = require('../models/Users');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fetchuser = require('../middlewares/fetchuser');
require('dotenv').config();

/*
JWT_SECRET variable has been defined in .env file
*/
const JWT_SECRET = process.env.JWT_SECRET;

// Route 1: Create a User using POST: /api/v1/auth/create_user. No Login required.
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
      .isLength({ min: 8 })
      .withMessage('Password must be atleast of 8 characters'),
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

        // Implement bcrypt package to generate the salt and hashing for the password to store it in DB
        /* Both the bcrypt.genSalt and bcrypt.hash returns a promise, we need to use await as a must*/
        const salt = await bcrypt.genSalt(10);
        const securePassword = await bcrypt.hash(request.body.password, salt);
        const secureConfirmPassword = await bcrypt.hash(
          request.body.confirmPassword,
          salt
        );

        user = await Users.create({
          firstName: request.body.firstName,
          lastName: request.body.lastName,
          email: request.body.email,
          password: securePassword,
          confirmPassword: secureConfirmPassword,
        });

        /*
        Implement JWT tokens once user has been created.
        */
        const data = {
          userID: { id: user.id },
        };
        const authToken = jwt.sign(data, JWT_SECRET);
        isValid = true;
        response.json({ isValid, authToken });
      }
    } catch (error) {
      return response.status(400).send({ error: error.message });
    }
  }
);

// Route 2: Login a User using POST: /api/v1/auth/login. No Login required.
router.post(
  '/login',
  [
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
      .withMessage('Password must be atleast of 6 characters'),
  ],
  async (request, response) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = request.body;
      let isValid = false;
      const user = await Users.findOne({ email });
      if (!user) {
        return response.status(400).json({
          isValid,
          error: 'Please try to login with the correct credentials',
        });
      }

      /*
      user.password is the same password which we call at the time of findOne. findOne is a function in MongoDB where you can find a collection based on the query, which we send.
      */
      // Use of await is mandatory below otherwise, it will allow user to login with any password
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return response.status(400).json({
          isValid,
          error: 'Please try to login with the correct credentials',
        });
      }

      // If both the above conditions true, then the below code will run
      const data = {
        userID: { id: user.id },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      isValid = true;
      response.json({ isValid, authToken });
    } catch (error) {
      return response.status(400).send({ error: error.message });
    }
  }
);

// Route 3: Get information about the current user using POST: /api/v1/auth/get_current_user. Login required.
router.post('/get_current_user', fetchuser, async (request, response) => {
  try {
    const userID = request.user.id;
    const user = await Users.findById(userID)
      .select('-password')
      .select('-confirmPassword');
    response.json(user);
  } catch (error) {
    return response.status(400).send({ error: error.message });
  }
});

// Route 4: Get information about another user - GET: /api/v1/auth/get_user/:id. Login required.
router.get('/get_user/:id', fetchuser, async (request, response) => {
  try {
    let isValid = false;
    const userID = request.params.id;
    const user = await Users.findById(userID)
      .select('-password')
      .select('-confirmPassword');
    if (!user) {
      return response.status(404).json({ isValid, error: 'User Not Found' });
    } else {
      isValid = true;
      response.json({ isValid, user });
    }
  } catch (error) {
    return response.status(400).send({ error: error.message });
  }
});

// Route 5: Update a user - PUT: /api/v1/auth/update_user/:id. Login required.
router.put(
  '/update_user/:id',
  fetchuser,
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
  ],
  async (request, response) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    try {
      // Destructing and get the firstname, lastname, email
      const { firstName, lastName, email } = request.body;
      let updateUser = {};

      // Insert the firstname, lastname, email to the updateUser object
      if (firstName) {
        updateUser.firstName = firstName;
      }
      if (lastName) {
        updateUser.lastName = lastName;
      }
      if (email) {
        updateUser.email = email;
      }

      // Find if the user is available in the database
      const userID = request.params.id;
      let user = await Users.findById(userID)
        .select('-password')
        .select('-confirmPassword');

      // Check the edited email is unique or not
      if (email) {
        const existingUser = await Users.findOne({ email });
        if (existingUser && existingUser._id.toString() !== userID) {
          return response.status(403).json({ error: 'Email already in use' });
        }
      }

      // Check if user is the same person who edits his own account details.
      if (user._id.toString() !== request.user.id) {
        return response
          .status(403)
          .json({ error: 'You are not authorized to perform this action' });
      }

      /*
      Once the user has been found and all the validation is true, below code will update the user information.
      */

      user = await Users.findByIdAndUpdate(
        request.params.id,
        {
          $set: updateUser,
        },
        { new: true }
      )
        .select('-password')
        .select('-confirmPassword');
      response.json(user);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  }
);

// Route 6: Delete a user - DELETE: /api/v1/auth/delete_user/:id. Login Required.
router.delete('/delete_user/:id', fetchuser, async (request, response) => {
  // Find the user in database
  const userID = request.params.id;
  let user = await Users.findById(userID);
  if (!user) {
    return response.status(404).json({ error: 'Not found in Database' });
  }

  // Check if the user is same who wants to delete own account
  if (user._id.toString() !== request.user.id) {
    return response
      .status(403)
      .json({ error: 'You are not authorized to perform this action' });
  }

  // If user is found, delete the note
  user = await Users.findByIdAndDelete(userID);
  response.json({ Success: 'User has been deleted', user: user });
});

module.exports = router;

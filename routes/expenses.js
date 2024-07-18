const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const fetchuser = require('../middlewares/fetchuser');
const Users = require('../models/Users');
const { expenses, usersInExpense } = require('../models/Expenses');

// Route 1: Create an expense using POST:/api/v1/expenses/create_expense. Login required.
router.post(
  '/create_expense',
  fetchuser,
  [
    body('cost')
      .notEmpty()
      .withMessage('Cost cannot be blank')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Cost cannot be 0 or negative');
        }
        return true; // Validation passed
      }),
    body('description').notEmpty().withMessage('Description cannot be empty'),
    body('splitEqually')
      .isBoolean()
      .withMessage('Split Equally must be a boolean')
      .notEmpty()
      .withMessage('Split Equally cannot be empty'),
  ],
  async (request, response) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    try {
      // Destructing the variable from request body and fetchuser
      const { cost, description, splitEqually, groupID } = request.body;
      const expenseCreatorID = request.user.id;

      // Fetch the user details and assigned it in a variable
      const expenseCreator = await Users.findById(expenseCreatorID)
        .select('-password')
        .select('-confirmPassword');

      // If not found, then return error response
      if (!expenseCreator) {
        return response.status(404).json({ error: 'User Not Found' });
      }

      const paid_share = cost;
      const owed_share = splitEqually ? cost / 2 : 0;
      const net_balance = splitEqually ? paid_share - owed_share : 0;

      const expenseCreatorDetails = new usersInExpense({
        user: {
          user_id: expenseCreator._id,
          firstName: expenseCreator.firstName,
          lastName: expenseCreator.lastName,
          email: expenseCreator.email,
        },
        user_id: expenseCreator._id,
        paid_share,
        owed_share,
        net_balance,
      });

      // Create the expense
      const newExpense = new expenses({
        cost: cost,
        description: description,
        groupID: groupID || null,
        splitEqually: splitEqually,
        createdBy: expenseCreatorDetails.user,
        updatedBy: expenseCreatorDetails.user,
        users: [expenseCreatorDetails],
      });

      const savedExpenses = await newExpense.save();
      response.json(savedExpenses);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  }
);

// Route 2: Update an expense. PUT:/api/v1/expenses/update_expense/:id. Login required.
router.put(
  '/update_expense/:id',
  fetchuser,
  [
    body('cost')
      .notEmpty()
      .withMessage('Cost cannot be blank')
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Cost cannot be 0 or negative');
        }
        return true; // Validation passed
      }),
    body('description').notEmpty().withMessage('Description cannot be empty'),
    body('splitEqually')
      .isBoolean()
      .withMessage('Split Equally must be a boolean')
      .notEmpty()
      .withMessage('Split Equally cannot be empty'),
  ],
  async (req, res) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const expenseId = req.params.id;
      const { cost, description, splitEqually } = req.body;
      let updateExpense = {};

      // Add the values to the updateExpense object
      if (cost) {
        updateExpense.cost = cost;
      }
      if (description) {
        updateExpense.description = description;
      }
      if (splitEqually) {
        updateExpense.splitEqually = splitEqually;
      }

      // Find the expense in the Database
      let expenseDetails = await expenses.findById(expenseId);
      if (!expenseDetails) {
        return res.status(404).json({ error: 'Expense Not Found' });
      }

      /*
        Task: Check if the person who is editing the text is also a memeber of the expenses or not?
      */
      // Checking if the user is the creator of the expense or not
      if (expenseDetails.createdBy.user_id.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ error: 'You are not authorized to perform this task' });
      }

      // Updated By Information should be fetched who is currently loggedin and perform this task.
      const updatedByUserDetails = await Users.findById(req.user.id).select(
        '-password, -confirmPassword'
      );

      // If the cost has been modified then we have to paid_share, owed_share, net_balance
      /*
        We can check this further
      */
      //   const paid_share = cost;
      //   const owed_share = splitEqually ? cost / 2 : 0;
      //   const net_balance = splitEqually ? paid_share - owed_share : 0;

      // Create the update object
      updateExpense = {
        cost,
        description,
        splitEqually,
        updatedAt: Date.now(),
        updatedBy: {
          user_id: updatedByUserDetails._id,
          firstName: updatedByUserDetails.firstName,
          lastName: updatedByUserDetails.lastName,
          email: updatedByUserDetails.email,
        },
      };

      // Update the information in the Database
      expenseDetails = await expenses.findByIdAndUpdate(
        expenseId,
        { $set: updateExpense },
        { new: true }
      );
      res.json(expenseDetails);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }
  }
);

// Route 3: Delete the expense. DELETE:/api/v1/expenses/delete_expense/:id. Login required.
router.delete('/delete_expense/:id', fetchuser, async (req, res) => {
  try {
    const expenseId = req.params.id;

    // Fetch the expense from Id
    let expense = await expenses.findById(expenseId);
    console.log(expense);

    // Check if the expense is available in Database
    if (!expense) {
      return res.status(401).json({ error: 'Not Found in Database' });
    }

    /*
        Task: We might have the functionality later to delete the expense if the user is in the userInExpense list
    */
    // Check if the creator is the user who is deleting the item
    if (expense.createdBy.user_id.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to perform this task' });
    }

    // If all the validation comes true, delete the expense.
    expense = await expenses.findByIdAndDelete(expenseId);
    res.json({ success: 'Expense has been deleted', expense: expense });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
});

module.exports = router;

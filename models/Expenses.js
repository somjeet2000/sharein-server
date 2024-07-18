const mongoose = require('mongoose');
const { Schema } = mongoose;

const CreatedByUpdatedByDeletedBySchema = new Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
});

const usersInExpensesSchema = new Schema({
  user: {
    type: CreatedByUpdatedByDeletedBySchema,
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  paid_share: {
    type: Number,
    required: true,
  },
  owed_share: {
    type: Number,
    required: true,
  },
  net_balance: {
    type: Number,
    required: true,
  },
});

const expensesSchema = new Schema({
  cost: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: CreatedByUpdatedByDeletedBySchema,
    required: true,
  },
  groupID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'groups',
    default: null,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  updatedBy: {
    type: CreatedByUpdatedByDeletedBySchema,
  },
  deletedAt: {
    type: Date,
  },
  deletedBy: {
    type: CreatedByUpdatedByDeletedBySchema,
  },
  splitEqually: {
    type: Boolean,
    default: true,
  },
  users: [usersInExpensesSchema],
});

const expenses = mongoose.model('expense', expensesSchema);
const usersInExpense = mongoose.model('usersInExpense', usersInExpensesSchema);
module.exports = { expenses, usersInExpense };

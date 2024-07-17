const mongoose = require('mongoose');
const { Schema } = mongoose;

const memberSchema = new Schema({
  user: {
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

const groupSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  groupType: {
    type: String,
    default: 'General',
  },
  updatedTime: {
    type: Date,
    default: Date.now,
  },
  members: [memberSchema],
  creator: {
    type: memberSchema,
    required: true,
  },
});

const groups = mongoose.model('groups', groupSchema);
const members = mongoose.model('member', memberSchema);
module.exports = { groups, members };

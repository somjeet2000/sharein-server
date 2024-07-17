const mongoose = require('mongoose');
const { Schema } = mongoose;

const memberSchema = {
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
};

const groupSchema = {
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
};

module.exports = mongoose.model('groups', groupSchema);

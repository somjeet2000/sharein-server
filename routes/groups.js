const express = require('express');
const fetchuser = require('../middlewares/fetchuser');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Groups = require('../models/Groups');
const Users = require('../models/Users');

// Route 1: Create a group. POST: /api/v1/groups/create_group. Login required.
router.post(
  '/create_group',
  fetchuser,
  [
    // firstName must not be empty.
    body('name', 'Group Name cannot be empty').notEmpty(),
    // lastName must not be empty.
    body('groupType', 'Type cannot be empty').notEmpty(),
  ],
  async (request, response) => {
    // Finds the validation errors in this request and wraps them in an object with handy functions
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
      return response.status(400).json({ errors: errors.array() });
    }
    try {
      // createID will come from the fetchuser middleware
      const creatorID = request.user.id;

      // Fetch the creator information
      /*
        Task: If any issues will come later, we have to remove the id from the below code, so that the id should matches with the member id
      */
      const creator = await Users.findById(creatorID)
        .select('-_id')
        .select('-password')
        .select('-confirmPassword');

      console.log(creator);

      // Assign the value to the group
      const newGroup = new Groups({
        name: request.body.name,
        groupType: request.body.groupType,
        members: [creator],
        creator: creator,
      });

      const savedGroup = await newGroup.save();
      response.json(savedGroup);
    } catch (error) {
      return response.status(400).json({ error: error.message });
    }
  }
);

// Route 2: List the current User's group. GET: /api/v1/groups/get_groups. Login required.
router.get('/get_groups', fetchuser, async (request, response) => {
  try {
    /*
    Get the current Logged in User ID from the request.user from middleware. Use of find function will find the groups, created by the user.
    IMP: Task: Later on we might implement the functionality that whether user is creator or member of groups, groups will be visible.
    */
    const userID = request.user.id;
    const groups = await Groups.find({ 'creator._id': userID });
    response.json(groups);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

// Route 3: Get Information about a Group. GET: /api/v1/groups/get_group/:id. Login required.
router.get('/get_group/:id', fetchuser, async (request, response) => {
  try {
    const group = await Groups.findById(request.params.id);
    if (!group) {
      return response.status(404).send('Not Found');
    }
    response.json(group);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

// Route 4: Delete a group. DELETE: /api/v1/groups/delete_group/:id. Login required.
router.delete('/delete_group/:id', fetchuser, async (request, response) => {
  try {
    const groupID = request.params.id;
    // Find the group by Group ID
    let group = await Groups.findById(groupID);
    if (!group) {
      return response.status(404).send({ error: 'Group Not Found' });
    }

    // Check if user is the same user who wants to delete
    if (group.creator._id.toString() !== request.user.id) {
      return response
        .status(403)
        .send({ error: 'You are not authorized to perform this action' });
    }

    // All the above validation gives true, then the below code to delete the group will run
    group = await Groups.findByIdAndDelete(groupID);
    response.json({ success: 'You group has been deleted', group: group });
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

// Route 5: Add a user to the group. POST: /api/v1/groups/add_user_to_group. Login required.
router.post('/add_user_to_group', fetchuser, async (request, response) => {
  try {
    const { userID, groupID } = request.body;
    // Find the user by ID
    let user = await Users.findById(userID);
    if (!user) {
      return response.status(404).json({ error: 'User Not Found' });
    }
    // Find the group by ID
    let group = await Groups.findById(groupID);
    if (!group) {
      return response.status(404).json({ error: 'Group Not Found' });
    }
    // Check if user is already the member of the group
    for (let index = 0; index < group.members.length; index++) {
      const element = group.members[index].email;
      if (element === user.email) {
        return response
          .status(403)
          .json({ error: 'User is already a member of the group' });
      }
    }
    // If all the above validation is true, run below code to add the user in the members list.
    /*
        Id will be generated that is new for member id and user id will be different
    */
    group.members.push({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    });

    const savedGroup = await group.save();
    response.json(savedGroup);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

module.exports = router;

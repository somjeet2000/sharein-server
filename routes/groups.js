const express = require('express');
const fetchuser = require('../middlewares/fetchuser');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { groups, members } = require('../models/Groups');
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
      const creator = await Users.findById(creatorID)
        .select('-password')
        .select('-confirmPassword');

      // Assigning the values of creator to our member model
      const createUserMember = new members({
        firstName: creator.firstName,
        lastName: creator.lastName,
        email: creator.email,
        user: creator._id,
      });

      // Assign the value to the group
      const newGroup = new groups({
        name: request.body.name,
        groupType: request.body.groupType,
        members: [createUserMember],
        creator: createUserMember,
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
    const getGroups = await groups.find({ 'creator.user': userID });
    response.json(getGroups);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

// Route 3: Get Information about a Group. GET: /api/v1/groups/get_group/:id. Login required.
router.get('/get_group/:id', fetchuser, async (request, response) => {
  try {
    const group = await groups.findById(request.params.id);
    if (!group) {
      return response.status(404).send('Group Not Found');
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
    let group = await groups.findById(groupID);
    if (!group) {
      return response.status(404).send({ error: 'Group Not Found' });
    }

    // Check if group creator is the same user who wants to delete
    /*
      Task: In Future, we might allow the group members as well to delete the groups.
    */
    if (group.creator.user.toString() !== request.user.id) {
      return response
        .status(403)
        .send({ error: 'You are not authorized to perform this action' });
    }

    // All the above validation gives true, then the below code to delete the group will run
    group = await groups.findByIdAndDelete(groupID);
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
    let group = await groups.findById(groupID);
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
      user: userID,
    });

    const savedGroup = await group.save();
    response.json(savedGroup);
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

// Route 6: Remove a user to the group. POST: /api/v1/groups/remove_user_from_group. Login required.
router.post('/remove_user_from_group', fetchuser, async (request, response) => {
  try {
    const { userID, groupID } = request.body;
    // Find the user by ID
    let user = await Users.findById(userID);
    if (!user) {
      return response.status(404).json({ error: 'User Not Found' });
    }
    // Find the group by ID
    let group = await groups.findById(groupID);
    if (!group) {
      return response.status(404).json({ error: 'Group Not Found' });
    }
    /*
      Task: If User has non-zero balance, donot allow to remove the user from the group
    */
    // Check if user is the member of the group, if found then remove the user.
    /*
      findIndex method is used to find and return the 1st found index of the search, if not found it will return -1
    */
    const userIndexToBeRemoved = group.members.findIndex(
      (members) => members.email === user.email
    );
    if (userIndexToBeRemoved === -1) {
      return response
        .status(404)
        .json({ Error: 'User Not Found in the Members List' });
    }

    // When found in Database
    const removedUser = group.members.splice(userIndexToBeRemoved, 1);
    const savedGroup = await group.save();
    response.json({ Group: savedGroup, removedUser: removedUser });
    // If all the above validation is true, run below code to add the user in the members list.
  } catch (error) {
    return response.status(400).json({ error: error.message });
  }
});

module.exports = router;

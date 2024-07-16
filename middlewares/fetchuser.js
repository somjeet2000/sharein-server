const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const fetchuser = (request, response, next) => {
  // Get the user from the JWT Token and Add ID to the request object

  // Get the token
  const token = request.header('auth-token');
  if (!token) {
    response
      .status(401)
      .send({ error: 'Please authenticate using a valid token' });
  }

  try {
    // Verify if the token is correct and store the response into userData
    const data = jwt.verify(token, JWT_SECRET);
    // Add it to request object
    /* Always remember the object details when we send the data as JWT Token */
    request.user = data.userID;
    next();
  } catch (error) {
    response.status(401).send({ error: 'Unauthorized User' });
  }
};

module.exports = fetchuser;

require('dotenv').config();
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URL;

const connectToMongo = () => {
  mongoose
    .connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log('Success: Connected to Mongo DB');
    })
    .catch((error) => {
      console.log('Error connecting to Mongo DB:' + error);
    });
};

module.exports = connectToMongo;

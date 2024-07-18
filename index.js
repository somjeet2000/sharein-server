const connectToMongo = require('./database');
const express = require('express');

connectToMongo();

const app = express();
const port = 5000;

app.use(express.json());

//Available routes
app.use('/api/v1/auth', require('./routes/authentication'));
app.use('/api/v1/groups', require('./routes/groups'));
app.use('/api/v1/expenses', require('./routes/expenses'));

app.listen(port, () => {
  console.log(`ShareIn server listening on port ${port}`);
});

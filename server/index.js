/**
 * Required External Modules
 */

const config = require('config');
const express = require('express'); // Fast, un-opinionated, minimalist web framework for Node.js
require('express-async-errors');
const cors = require('cors'); // Express middleware to enable CORS with various options
const mongoose = require('mongoose');
const path = require('path');
const helmet = require('helmet'); // Express middleware to secure your apps by setting various HTTP headers, which mitigate common attack vectors
const controllers = require('./controllers');
const errorHandler = require('./middleware/errorMiddleware');

/**
 * App Variables
 */

const app = express();
const MONGODB_URI = config.get('mongoDBUri');
const PORT = config.get('port');

/**
 * MongoDB Database Connection
 */

console.log('Connecting to ', MONGODB_URI);
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

/**
 *  App Configuration
 */

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
require('./config/passport')(app);

app.use(controllers);

app.use(errorHandler);

// app.get('/ping', (request, response) => {
//   console.log(request.headers.host);
//   console.log(request.hostname);
//   response.send('pong');
// });

/**
 * Server Activation
 */

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

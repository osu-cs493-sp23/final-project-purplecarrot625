const express = require('express');
const morgan = require('morgan');
const swaggerSetup = require('./swagger');
require('dotenv').config();

const api = require('./api');

const app = express();
const port = process.env.PORT || 8000;

swaggerSetup(app);

const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:root123@localhost:27017/tarpaulindb?authSource=admin'

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB')
})

mongoose.connection.on('error', (err) => {
  console.log('Error connecting to MongoDB', err)
})

/*
 * Morgan is a popular request logger.
 */
app.use(morgan('dev'));

app.use(express.json());
app.use(express.static('public'));
/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})

app.listen(port, function() {
  console.log("== Server is running on port", port);
});
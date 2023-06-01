/*
 * This file contains a simple script to populate the database with initial
 * data from the files in the data/ directory.  The following environment
 * variables must be set to run this script:
 *
 *   MONGO_DB_NAME - The name of the database into which to insert data.
 *   MONGO_USER - The user to use to connect to the MongoDB server.
 *   MONGO_PASSWORD - The password for the specified user.
 *   MONGO_AUTH_DB_NAME - The database where the credentials are stored for
 *     the specified user.
 *
 * In addition, you may set the following environment variables to create a
 * new user with permissions on the database specified in MONGO_DB_NAME:
 *
 *   MONGO_CREATE_USER - The name of the user to create.
 *   MONGO_CREATE_PASSWORD - The password for the user.
 */
require('dotenv').config()

// const mongoose = require('mongoose');
// const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:root123@localhost:27017/tarpaulindb?authSource=admin'

// mongoose.connect(MONGODB_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// })

// mongoose.connection.on('connected', () => {
//   console.log('Connected to MongoDB')
// })

// mongoose.connection.on('error', (err) => {
//   console.log('Error connecting to MongoDB', err)
// })

const { bulkInsertNewCourses } = require('./models/course')

const courseData = require('./data/courses.json')

const mongoCreateUser = process.env.MONGO_CREATE_USER
const mongoCreatePassword = process.env.MONGO_CREATE_PASSWORD


mongoose.connection.on('open', async function () {
    const ids = await bulkInsertNewCourses(courseData);
    console.log("== Inserted courses with IDs:", ids);

    if (mongoCreateUser && mongoCreatePassword) {
        console.log("== User creation should be handled outside the application code.");
    }

    mongoose.connection.close(function () {
        console.log("== DB connection closed")
    });
});
// /*
//  * Module for working with a MongoDB connection.
//  */

const mongoose = require('mongoose');
require('dotenv').config();

const mongoHost = process.env.MONGO_HOST || 'localhost'
const mongoPort = process.env.MONGO_PORT || 27017
const mongoUser = process.env.MONGO_ROOT_USER
const mongoPassword = process.env.MONGO_ROOT_PASSWORD
const mongoDbName = process.env.MONGO_DB_NAME
const mongoAuthDbName = process.env.MONGO_AUTH_DB_NAME || mongoDbName

//const MONGODB_URI = process.env.MONGODB_URI || `mongodb://${mongoUser}:${mongoPassword}@${mongoHost}:${mongoPort}/${mongoAuthDbName}`

const MONGODB_URI = 'mongodb://root:root123@localhost:27017/tarpaulindb?authSource=admin'

exports.connectToDb = function () {
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
}

exports.getDbReference = function () {
    return mongoose.connection;
}

exports.closeDbConnection = function () {
    mongoose.connection.close(() => {
        console.log('MongoDB connection closed')
    });
}


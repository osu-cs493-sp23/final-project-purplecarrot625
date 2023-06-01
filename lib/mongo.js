// /*
//  * Module for working with a MongoDB connection.
//  */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://rootuser:rootpass@localhost:27017/tarpaulindb?authSource=admin'

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


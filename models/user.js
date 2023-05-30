const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    example: "Jane Doe",
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    example: "doej@oregonstate.edu",
  },
  password: {
    type: String,
    required: true,
    trim: true,
    example: "hunter2",
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    default: 'student',
    example: "student",
  },
});

module.exports = mongoose.model('User', UserSchema);

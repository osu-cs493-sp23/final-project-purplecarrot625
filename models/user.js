const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'instructor', 'student'],
    default: 'student'
  }
});

exports.UserSchema = UserSchema

const User = mongoose.model('User', UserSchema);

/*
 * Insert a new User into the DB.
 */
const insertNewUser = async function (user) {
  try {
    const hash = await bcrypt.hash(user.password, 8);
    console.log(hash)
    user.password = hash;
    console.log("  -- userToInsert:", user);

    const insertedUser = new User(user); // Ensure 'User' is correctly imported.
    const result = await insertedUser.save();
    return result._id;
  } catch (err) {
    console.log("Error in insertNewUser:", err) // Log the entire error.
    return null;
  }
};

/*
* Fetch a user from the DB based on user ID.
*/
async function getUserById (id, includePassword) {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  } else {
    const projection = includePassword ? {} : { password: 0 };
    const user = await User.findById(id, projection).exec();
    return user;
  }
}
exports.getUserById = getUserById;

async function getUserByEmail (email, includePassword) {
    const projection = includePassword ? {} : { password: 0 };
    const user = await User.findOne({email: email}, projection).exec();
    return user;
  }
exports.getUserByEmail = getUserByEmail;

async function validateUser(email, password) {
  const user = await getUserByEmail(email, true);
  return user && await bcrypt.compare(password, user.password);
};

module.exports = {
  UserSchema,
  User,
  insertNewUser,
  getUserById,
  getUserByEmail,
  validateUser,
};
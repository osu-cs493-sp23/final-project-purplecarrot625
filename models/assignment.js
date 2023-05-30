const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AssignmentSchema = new Schema({
  courseId: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  due: {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Assignment', AssignmentSchema);

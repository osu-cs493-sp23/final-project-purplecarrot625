// This is the model for assignment

const mongoose = require('mongoose');
const Schema = mongoose.Schema;



const AssignmentSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  dueDate: {
    type: Date,
    required: true,
  },
  course: {
    type: Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  submissions: [{
    type: Schema.Types.ObjectId,
    ref: 'Submission'
  }]
});


module.exports = mongoose.model('Assignment', AssignmentSchema)

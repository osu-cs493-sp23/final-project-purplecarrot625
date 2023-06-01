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

const Assignment = mongoose.model('Assignment', AssignmentSchema);

async function createAssignment({ title, points, courseId, due }) {
  const assignment = new Assignment({
    _id: new mongoose.Types.ObjectId(),
    title,
    points,
    courseId,
    due,
  });

  return await assignment.save();
}

async function getAssignmentById(id) {
  return await Assignment.findById(id).lean();
}

async function updateAssignment(id, updateOps) {
  return await Assignment.updateOne({ _id: id }, { $set: updateOps }).exec();
}

async function deleteAssignment(id) {
  return await Assignment.findByIdAndDelete(id)
}

module.exports = {
  Assignment,
  createAssignment,
  getAssignmentById,
  updateAssignment,
  deleteAssignment
};
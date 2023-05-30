const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const SubmissionSchema = new Schema({
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    file: {
      type: String,
      required: true,
    },
    grade: {
      type: String,
    },
  });

  module.exports = mongoose.model('Submission', SubmissionSchema)
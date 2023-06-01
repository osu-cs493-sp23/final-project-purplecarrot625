const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const { ObjectId, GridFSBucket } = require('mongodb');
const fs = require('node:fs');

const { getDbReference } = require('../lib/mongo');

const SubmissionSchema = new Schema({
  assignmentId: {
    type: Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  studentId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  grade: {
    type: Number
  },
  file: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model('Submission', SubmissionSchema);

exports.saveFileInfo = async (file) => {
  const db = getDbReference();
  const collection = db.collection('files')
  const result = await collection.insertOne(file)
  return result.insertedId
}

exports.saveFile = async (file) => {
  return new Promise((resolve, reject) => {
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'files' })
    const metadata = {
      contentType: file.contentType,
      assignmentId: file.assignmentId,
      studentId: file.studentId,
      timestamp: file.timestamp,
      grade: file.grade
    }

    const uploadStream = bucket.openUploadStream(
      file.filename,
      { metadata: metadata }
    )
    fs.createReadStream(file.path).pipe(uploadStream)
      .on('error', (err) => {
        reject(err)
      }
      ).on('finish', (result) => {
        console.log("== write successful, result:", result)
        resolve(result._id)
      })
    })
}

exports.getFileById = async (id) => {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'files' })
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray()
      console.log("== results:", results)
      return results[0]
  }
}

exports.getFileDownloadStreamByFilename = (filename) => {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'files' })
  return bucket.openDownloadStreamByName(filename)
}
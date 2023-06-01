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
    //required: true
  }
});


const saveFileInfo = async (file) => {
  const db = getDbReference();
  const collection = db.collection('submissions')
  const result = await collection.insertOne(file)
  return result.insertedId
}

const saveFile = async (file) => {
  return new Promise((resolve, reject) => {
    console.log("== saveFile:", file)
    const db = getDbReference()
    const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
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

const getFileById = async (id) => {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  if (!ObjectId.isValid(id)) {
    return null
  } else {
    const results = await bucket.find({ _id: new ObjectId(id) })
      .toArray()
      console.log("== results:", results)
      return results[0]
  }
}

const getFileDownloadStreamByFilename = (filename) => {
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  return bucket.openDownloadStreamByName(filename)
}

const getFileByAssignmetnId = async (id) => {
  console.log("== getFileByAssignmentId:", id)
  const db = getDbReference()
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' })
  if (!ObjectId.isValid(id)) {
    console.log("== id is not valid")
    return null
  } else {
    console.log("== id is valid")

    const results = await bucket.find({ 'metadata.assignmentId': id }).toArray();
    console.log("== results:", results)
    return results
  }
}
module.exports = {
  Submission: mongoose.model('Submission', SubmissionSchema),
  saveFileInfo,
  saveFile,
  getFileById,
  getFileDownloadStreamByFilename,
  getFileByAssignmetnId
}
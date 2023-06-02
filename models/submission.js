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

const getFileByAssignmentId = async (assignmentId, pageNum, pageSize) => {
  console.log("== getFileByAssignmentId:", assignmentId);

  const db = getDbReference();
  const bucket = new GridFSBucket(db, { bucketName: 'submissions' });

  if (!ObjectId.isValid(assignmentId)) {
    console.log("== id is not valid");
    return null;
  } else {
    console.log("== id is valid");

    // calculate the total number of files
    const totalFiles = await db.collection('submissions.files').countDocuments({ 'metadata.assignmentId': assignmentId });

    // calculate the last page
    const lastPage = Math.ceil(totalFiles / pageSize);

    // adjust the page number within valid range
    pageNum = pageNum > lastPage ? lastPage : pageNum;
    pageNum = pageNum < 1 ? 1 : pageNum;

    // retrieve files
    const files = await bucket.find({ 'metadata.assignmentId': assignmentId })
      .skip((pageNum - 1) * pageSize)
      .limit(pageSize)
      .toArray();

    console.log("== results:", files);

    // Generate HATEOAS links for surrounding pages
    const links = {};
    if (totalFiles > 0) {
      if (pageNum < lastPage) {
        links.nextPage = `/files?page=${pageNum + 1}`;
        links.lastPage = `/files?page=${lastPage}`;
      }
      if (pageNum > 1) {
        links.prevPage = `/files?page=${pageNum - 1}`;
        links.firstPage = "/files?page=1";
      }
      if (lastPage == 1) {
        links.self = `/files?page=${pageNum}`;
      }
    }

    return {
      files,
      links,
      totalFiles,
      totalPages: lastPage,
      currentPage: pageNum,
    };
  }
}



module.exports = {
  Submission: mongoose.model('Submission', SubmissionSchema),
  saveFileInfo,
  saveFile,
  getFileById,
  getFileDownloadStreamByFilename,
  getFileByAssignmentId,
}
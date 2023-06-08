const express = require('express');
const morgan = require('morgan');
const swaggerSetup = require('./swagger');
const redis = require('redis');
require('dotenv').config();

const api = require('./api');
const db = require('./lib/mongo');  // 引入我们修改后的mongo.js

const app = express();
const port = process.env.PORT || 8000;

swaggerSetup(app);


const mongoose = require('mongoose');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://root:root123@localhost:27017/tarpaulindb?authSource=admin' // todo: 改为${}形式


/*
* Configure Redis client connection.
*/
const redisHost = process.env.REDIS_HOST || "localhost"
const redisPort = process.env.REDIS_PORT || "6379"
const redisClient = redis.createClient({
  url: `redis://${redisHost}:${redisPort}`
})

const rateLimitWindowMillis = 60000
const rateLimitMaxRequests = 10
const AuthenticatedLimitMaxRequests = 30
const rateLimitRefreshRate = rateLimitMaxRequests / rateLimitWindowMillis
const AuthenticatedLimitRefreshRate = AuthenticatedLimitMaxRequests / rateLimitWindowMillis

async function rateLimit(req, res, next) {
  console.log("== rateLimit()")
  let userEmail = req.user && req.user.email? req.user.email : req.ip // 判断是否登录，如果登录则使用email，否则使用ip
  let maxLimit = req.user && req.user.email? AuthenticatedLimitMaxRequests : rateLimitMaxRequests // 10 or 30 requests per minute
  let refreshRate = req.user && req.user.email? AuthenticatedLimitRefreshRate : rateLimitRefreshRate

  console.log("  -- userEmail:", userEmail)
  console.log("  -- maxLimit:", maxLimit)
  console.log("  -- refreshRate:", refreshRate)

  let tokenBucket
  try {
    tokenBucket = await redisClient.hGetAll(userEmail)
    console.log("  -- tokenBucket:", tokenBucket)
  } catch (e) {
    console.log("  -- error:", e)
    next()
    return
  }

  tokenBucket = {
    tokens: parseFloat(tokenBucket.tokens) || maxLimit,
    last: parseInt(tokenBucket.last) || Date.now()
  }

  const timestamp = Date.now()
  const ellapsedMillis = timestamp - tokenBucket.last
  tokenBucket.tokens += ellapsedMillis * refreshRate
  tokenBucket.tokens = Math.min(tokenBucket.tokens, maxLimit)
  tokenBucket.last = timestamp

  if (tokenBucket.tokens >= 1) {
    console.log("  -- tokenBucket.tokens:", tokenBucket.tokens)
    tokenBucket.tokens -= 1
    await redisClient.hSet(userEmail, [
      [ "tokens", tokenBucket.tokens ],
      [ "last", tokenBucket.last ]
    ])
    next()
  } else {
    console.log("  -- tokenBucket.tokens:", tokenBucket.tokens)
    await redisClient.hSet(userEmail, [
      [ "tokens", tokenBucket.tokens ],
      [ "last", tokenBucket.last ]
    ])
    res.status(429).send({
      error: "Too many requests per minute"
    })
  }
}

app.use(rateLimit)

/*
 * Morgan is a popular request logger.
 */
app.use(morgan('dev'));

app.use(express.json());

//app.use(express.static('public'));
/*
 * All routes for the API are written in modules in the api/ directory.  The
 * top-level router lives in api/index.js.  That's what we include here, and
 * it provides all of the routes.
 */
app.use('/', api);

app.use('*', function (req, res, next) {
  res.status(404).json({
    error: "Requested resource " + req.originalUrl + " does not exist"
  });
});

/*
 * This route will catch any errors thrown from our API endpoints and return
 * a response with a 500 status to the client.
 */
app.use('*', function (err, req, res, next) {
  console.error("== Error:", err)
  res.status(500).send({
      err: "Server error.  Please try again later."
  })
})


db.connectToDb();  // 连接到数据库

// Conntect to Redis server
redisClient.connect().then(() => {

app.listen(port, function() {
  console.log("== Server is running on port", port);
  })
});

// Desc: API routes

const { Router } = require('express')
const router = Router()

router.use('/assignments', require('./assignments').router)
//router.use('/courses', require('./courses').router)
//router.use('/users', require('./users').router)

module.exports = router
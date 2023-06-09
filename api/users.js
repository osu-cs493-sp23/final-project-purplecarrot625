/*
* API routes for 'users' collection.
*/

const router = require('express').Router()

const {
    UserSchema,
    insertNewUser,
    getUserById,
    validateUser,
    getUserByEmail
} = require('../models/user')
const { generateAuthToken, requireAuthentication } = require("../lib/auth")

exports.router = router;

router.post('/', async function (req, res) {
    try {
      const id = await insertNewUser(req.body);
      console.log(id);
      if (id) {
        res.status(201).send({ _id: id });
      } else {
        res.status(400).send({
          error: "Request body does not contain a valid User."
        });
      }
    } catch(err) {
      console.log("Error in POST /:", err); // Log the entire error.
      res.status(500).send({ error: 'Internal Server Error.' });
    }
  });

router.post('/login', async function (req, res, next) {
    if (req.body && req.body.email && req.body.password) {
        try {
            const authenticated = await validateUser(
                req.body.email,
                req.body.password
            )
            if (authenticated) {
                const user = await getUserByEmail(req.body.email, true)
                const token = generateAuthToken(req.body.email, user.role)
                res.status(200).send({
                    token: token
                })
            } else {
                res.status(401).send({
                    error: "Invalid authentication credentials"
                })
            }
        } catch (e) {
            next(e)
        }
    } else {
        res.status(400).send({
            error: "Request body requires `id` and `password`."
        })
    }
})

router.get('/:id', requireAuthentication, async function (req, res, next) {
    try {
        const user = await getUserById(req.params.id)
        console.log("1111",user)
        if (user.email === req.user.email) {
            console.log("2222",user)
            res.status(200).send(user)
        } else {
            res.status(403).send({
                err: "Unauthorized to access the specified resource"
            })
        }
    } catch (e) {
        next(e)
    }
})

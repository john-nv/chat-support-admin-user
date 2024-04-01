const router = require('express').Router()

const accountControllers = require('../controllers/account.controller')

// router.post('/createAccount', accountControllers.createAccount)
router.post('/login', accountControllers.login)
router.post('/verify', accountControllers.verifyJWT)

module.exports = router
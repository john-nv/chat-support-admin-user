const router = require('express').Router()

const messageControllers = require('../controllers/message.controller')
const accountControllers = require('../controllers/account.controller')

router.post('/getOne', messageControllers.getOne)
router.post('/getAllUser', accountControllers.mdwVerifyJwt, messageControllers.getAllUserId)
router.post('/updateSeen', messageControllers.updateSeen)

module.exports = router
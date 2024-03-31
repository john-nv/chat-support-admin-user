const router = require('express').Router()

const messageControllers = require('../controllers/message.controller')

router.post('/getOne', messageControllers.getOne)
router.post('/getAllUser', messageControllers.mdwAccount, messageControllers.getAllUserId)
router.post('/updateSeen', messageControllers.updateSeen)
router.post('/login', messageControllers.login)

module.exports = router
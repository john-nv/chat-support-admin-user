const router = require('express').Router()

const messageControllers = require('../controllers/message.controller')

router.post('/getOne', messageControllers.getOne)
router.post('/getAllUser', messageControllers.getAllUserId)
router.post('/updateSeen', messageControllers.updateSeen)

module.exports = router
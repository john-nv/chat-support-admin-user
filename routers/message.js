const router = require('express').Router()

const messageControllers = require('../controllers/message.controller')
const accountControllers = require('../controllers/account.controller')

router.post('/getOne', messageControllers.getOne)
router.post('/updateSeen', messageControllers.updateSeen)
router.post('/getAllUser', accountControllers.mdwVerifyJwt, messageControllers.getAllUserId)
router.post('/getConfig', messageControllers.getConfig)
router.post('/setConfig', accountControllers.mdwVerifyJwt, messageControllers.setConfig)

module.exports = router
const message = require('./message')
const account = require('./account')

function router(app) {
    app.use('/message', message)
    app.use('/account', account)
}

module.exports = router
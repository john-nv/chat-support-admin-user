const message = require('./message')

function router(app) {
    app.use('/message', message)
}

module.exports = router
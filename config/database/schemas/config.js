const mongoose = require('mongoose')

const Schema = mongoose.Schema

const config = new Schema({
    msgWelcome: String,
    msgReply: String,
    msg1: String,
    msg2: String,
    msg3: String,
    msg4: String,
    msg5: String,
})

module.exports = mongoose.model('config', config)
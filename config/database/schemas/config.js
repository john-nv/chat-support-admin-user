const mongoose = require('mongoose')

const Schema = mongoose.Schema

const config = new Schema({
    msgWelcome: String,
    msgReply: String,
})

module.exports = mongoose.model('config', config)
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const config = new Schema({
    msgWelcome: String,
})

module.exports = mongoose.model('config', config)
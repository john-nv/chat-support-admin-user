const bcrypt = require('bcrypt');
const mongoose = require('mongoose')

const Schema = mongoose.Schema

const admin = new Schema({
    username: String,
    password: String,
})

admin.pre('save', async function (next) {
    try {
        if (!this.password) return next()
        const salt = await bcrypt.genSalt(10)
        const hasPass = await bcrypt.hash(this.password, salt)
        this.password = hasPass
        next()
    } catch (error) {
        next(error)
    }
})

module.exports = mongoose.model('account', admin)
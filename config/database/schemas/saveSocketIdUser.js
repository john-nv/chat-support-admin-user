const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const saveSocketIdUser = new Schema({
    socketList: String
});

module.exports = mongoose.model('saveSocketIdUser', saveSocketIdUser);

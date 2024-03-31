const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    userId: String,
    messages: [
        {
            who: String,
            message: String,
            createdAt: {
                type: Date,
                default: Date.now,
                required: true
            }
        }
    ],
    seen: Boolean
}, {
    timestamps: true,
    timezone: 'Asia/Ho_Chi_Minh'
});

module.exports = mongoose.model('Message', messageSchema);

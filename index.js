const express = require('express')
const app = express()
require('dotenv').config()
const http = require('http')
const server = http.createServer(app)
const socketIO = require('socket.io')
var colors = require('colors')
const path = require('path');

const { connect } = require('./config/database/mongo')
const router = require('./routers/index')
const messageController = require('./controllers/message.controller')
const { sendMessage } = require('./utils/telegram')
const { saveImage } = require('./utils/saveImage')
const message = require('./config/database/schemas/message')
const PORT = process.env.PORT || 7892

connect()
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))
router(app)

const shareImagePath = path.join(__dirname, 'public', 'shareImage');
app.get('/admin', (req, res) => { res.sendFile(__dirname + '/public/admin.html') })
app.use('/images', express.static(shareImagePath));
app.get('/', (req, res) => { res.sendFile(__dirname + '/public/') })

startServerSocket()
server.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`.green) })

async function startServerSocket() {
    const ioAdmin = socketIO(server, { path: process.env.PATH_ADMIN || '/admin' })
    const ioUser = socketIO(server, { path: process.env.PATH_USER || '/user' })
    let listUser = []

    // get list socket for user
    listUser = await messageController.getSaveSocketIdUser() || []

    ioAdmin.on('connection', (socket) => {
        // console.log('✅✅✅ Admin connected:', socket.id)
        socket.on('disconnect', () => {
            // console.log('❌❌❌  Admin disconnected:', socket.id)
        })

        socket.on('message', async(payload) => {
            const user = listUser.find(user => user.userId == payload.userId)
            if (!user.socketId) return console.log('không có user.socketId')
            await messageController.updateOne(payload, 'admin', true)
            ioUser.to(user.socketId).emit('message', payload);
        })

        socket.on('changeUsernameUser', async(payload) => {
            const { userId, userNameChange } = payload

            const user = listUser.find(user => user.userId == userId)
            if (!user.socketId) return console.log('không có user.socketId')

            const updateUsername = await messageController.updateUserName(userId, userNameChange)

            if (updateUsername) {
                ioUser.to(user.socketId).emit('UPDATE_USERNAME', payload);
            }

            ioAdmin.emit('ALERT_UPDATE_USERNAME', updateUsername.message)
        })

        socket.on('delete-all-users', async(payload) => {
            listUser = []
            try {
                await messageController.updateSaveSocketIdUser(listUser)
                await messageController.deleteAllMessages()
                ioUser.emit('DELETE_ALL_USER');
                ioAdmin.emit('ALERT_NOTIFI', { message: "Xoá toàn bộ users thành công" })
            } catch (error) {
                console.log(error)
                ioAdmin.emit('ALERT_NOTIFI', { message: "Xoá users thất bại vui lòng thử lại sau" })
            }
        })

        socket.on('SEND_IMAGE', async(payload) => {
            const { message, nameFile, userId } = payload
            const nameImage = await saveImage(message, nameFile)

            await messageController.updateOne({ userId, message: nameFile }, 'admin')

            const user = listUser.find(user => user.userId == userId)
            if (!user.socketId) return console.log('không có user.socketId')

            ioUser.to(user.socketId).emit('message', payload);
        })
    })

    // count user connect
    let countUserConnect = 0
    ioUser.on('connection', (socket) => {
        // console.log('✅✅✅ User connected:', socket.id)

        socket.on('init', async(payload) => {
            countUserConnect++
            const { userId, socketId, userName } = payload

            const index = listUser.findIndex(user => user.userId === userId)
            if (index === -1) {
                listUser.push({ userId, socketId })
                await messageController.create(payload)
            } else {
                listUser[index].socketId = socketId
            }
            if (countUserConnect >= process.env.COUNT_USER_CONNECT) {
                await messageController.updateSaveSocketIdUser(listUser)
                countUserConnect = 0
            }

        })

        socket.on('message', async(payload) => {
            await messageController.updateOne(payload, 'user')
            const { userName, message } = payload
            sendMessage(`Username : ${userName}
Message : ${message}`)
            ioAdmin.emit('message', payload)
        })

        socket.on('SEND_IMAGE', async(payload) => {
            const { message, nameFile, userId, userName } = payload
            const nameImage = await saveImage(message, nameFile)

            await messageController.updateOne({ userId, message: nameFile }, 'user')
            sendMessage(`Username : ${userName} => gửi ảnh`)
            ioAdmin.emit('message', payload)
        })

        socket.on('disconnect', () => {
            // console.log('❌❌❌ User disconnected:', socket.id)
        })
    })
}
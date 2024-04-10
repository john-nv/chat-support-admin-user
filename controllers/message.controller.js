const mongoose = require('mongoose')
require('dotenv').config()
var colors = require('colors')

const { messagesSchema, saveSocketIdUserSchema, configSchema } = require('../config/database/schemas')

class messageControllers {
    async create(payload) {
        const { userId, userName } = payload
        try {
            let user = await messagesSchema.findOne({ userId })
            if (user) return
            const newMessage = new messagesSchema({ userId, seen: false, username: userName, messages: [] })
            await newMessage.save()
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async createSaveSocketIdUser(payload) {
        try {
            let socketList = new saveSocketIdUserSchema({ socketList: '[]' })
            await socketList.save()
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async updateSaveSocketIdUser(data) {
        try {
            data = JSON.stringify(data)
            const update = await saveSocketIdUserSchema.updateOne({ _id: process.env._ID_SAVE_LIST_SOCKET_USER }, { socketList: data })
            console.log('Cập nhật danh sách socket của user vào DB thành công'.green)
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async getSaveSocketIdUser(data) {
        try {
            data = JSON.stringify(data)
            let socketList = await saveSocketIdUserSchema.findOne({ _id: process.env._ID_SAVE_LIST_SOCKET_USER })
            console.log('Lấy list dữ liệu socket của user thành công'.green)
            return JSON.parse(socketList.socketList)
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async getOne(req, res) {
        try {
            const { userId, page = 1, pageSize = 200 } = req.body;
            if (!userId || userId.trim() === '') return res.status(200).json([]);
            const startIndex = (page - 1) * pageSize;
            const messageUser = await messagesSchema.aggregate([
                { $match: { userId } },
                { $unwind: "$messages" },
                { $sort: { "messages.createdAt": -1 } },
                { $group: { _id: "$_id", messages: { $push: "$messages" } } },
                {
                    $project: {
                        messages: {
                            $slice: ["$messages", startIndex, pageSize]
                        },
                        totalCount: {
                            $size: "$messages"
                        }
                    }
                }
            ]);
            if (messageUser && messageUser.length > 0) {
                return res.status(200).json({ messages: messageUser[0].messages, totalCount: messageUser[0].totalCount });
            } {
                return res.status(200).json({ messages: [], totalCount: 0, user: 0 });
            }
            return res.status(200).json({ messages: [], totalCount: 0 });
        } catch (error) {
            res.status(500).json([]);
            console.error(error);
        }
    }


    // async getAll() {
    //     try {
    //         let listMessageUser = await messagesSchema.find().sort({ createdAt: -1 }).limit(50)
    //         if (listMessageUser.length > 0) return listMessageUser
    //         return []
    //     } catch (error) {
    //         console.error(error)
    //         console.error(error.message)
    //     }
    // }

    async getAllUserId(req, res) {
        try {
            let listMessageUser = await messagesSchema.aggregate([
                { $unwind: "$messages" },
                { $sort: { "messages.createdAt": -1 } },
                {
                    $group: {
                        _id: "$userId",
                        latestMessage: { $first: "$messages" },
                        seen: { $last: "$seen" },
                        username: { $first: "$username" }
                    }
                },
                { $sort: { "latestMessage.createdAt": -1 } },
                { $limit: 50 },
                { $project: { userId: "$_id", seen: 1, _id: 0, username: 1, } }
            ]);

            if (listMessageUser.length > 0) return res.status(200).json(listMessageUser)
            return res.status(200).json([])
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async updateOne(payload, who, seen = false) {
        try {
            const { userId, message } = payload
            const existingUser = await messagesSchema.findOne({ userId })

            if (!existingUser) {
                console.log(`User ${userId} không tồn tại trong cơ sở dữ liệu. (updateOne)`)
                return
            }
            const updateData = {
                $push: {
                    messages: {
                        who,
                        message,
                        createdAt: new Date()
                    }
                },
                seen: seen
            }

            const update = await messagesSchema.findOneAndUpdate({ userId }, updateData)
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async updateSeen(req, res) {
        try {
            const { userId } = req.body
            const existingUser = await messagesSchema.findOne({ userId })

            if (!existingUser) {
                console.log(`User ${userId} không tồn tại trong cơ sở dữ liệu. (updateSeen)`)
                return res.status(200).json(0)
            }

            let update = await messagesSchema.findOneAndUpdate({ userId }, { seen: true })
            return res.status(200).json(1)
        } catch (error) {
            console.error(error)
            console.error(error.message)
        }
    }

    async getConfig(req, res) {
        try {
            let config = await configSchema.findOne({ _id: process.env._ID_CONFIG })
            return res.status(200).json(config)
        } catch (error) {
            console.error(error.message)
        }
    }

    async setConfig(req, res) {
        try {
            const { msgWelcome } = req.body
            let config = await configSchema.updateOne({ _id: process.env._ID_CONFIG }, { msgWelcome })
            return res.status(200).json({ message: 'Thay đổi thành công' })
        } catch (error) {
            console.error(error.message)
        }
    }
}

module.exports = new messageControllers
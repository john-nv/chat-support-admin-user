const mongoose = require('mongoose')
require('dotenv').config()
var colors = require('colors')
const jwt = require('jsonwebtoken');

const { accountSchema } = require('../config/database/schemas')
const { bcrypt, jsonWebToken } = require('../utils')
const secretKey = process.env.JWT_SECRET
class accountControllers {

    async verifyJWT(req, res, next) {
        try {
            const { token } = req.body;
            const decodedPayload = await jwt.verify(token, secretKey);
            if (!decodedPayload) return res.status(200).json({ expired: false, message: 'Phiên đăng nhập hết hạn' });
            return res.status(200).json({ expired: false, message: 'Còn hạn sử dụng' });
        } catch (error) {
            console.error('JWT:', error.message);
            return res.status(200).json({ expired: false, message: 'Phiên đăng nhập hết hạn' });
        }
    }

    async mdwVerifyJwt(req, res, next) {
        try {
            const { token } = req.body;
            if (!token) return res.status(401).json({ message: 'Token không tồn tại' });
            const decodedPayload = await jwt.verify(token, secretKey);
            if (!decodedPayload) return res.status(401).json({ message: 'Phiên đăng nhập hết hạn' });
            req.user = decodedPayload;
            next();
        } catch (error) {
            console.error('Lỗi xác thực JWT:', error.message);
            return res.status(500).json({ message: 'Lỗi xác thực JWT' });
        }
    }

    async login(req, res) {
        try {
            const { username, password } = req.body
            const accountDb = await accountSchema.findOne({ username })
            if (!accountDb) return res.status(200).json({ code: 0, message: 'Tài khoản không tồn tại' })
            const isCheck = await bcrypt.bcryptCompare(accountDb.password, password)
            if (!isCheck) return res.status(200).json({ code: 0, message: 'Sai tài khoản hoặc mật khẩu' })
            const jwtCode = await jsonWebToken.generateJWT({ username })
            return res.status(201).json({ code: 1, message: 'Đăng nhập thành công', token: jwtCode })
        } catch (error) {
            console.error(error)
            res.json({ message: error.message })
        }
    }

    // async createAccount(req, res) {
    //     try {
    //         const { username, password } = req.body
    //         const accountNew = new accountSchema({
    //             username,
    //             password
    //         })
    //         await accountNew.save()
    //         return res.status(200).json(accountNew)
    //     } catch (error) {
    //         console.log(error)
    //         console.log(error.message)
    //     }
    // }
}

module.exports = new accountControllers
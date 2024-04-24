const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

module.exports = {
    saveImage: async function(imageData, nameFile = 'null') {
        try {
            const directory = './public/shareImage';
            if (!fs.existsSync(directory)) {
                fs.mkdirSync(directory);
            }
            const imagePath = path.join(directory, nameFile);

            try {
                const image = await Jimp.read(Buffer.from(imageData.split(',')[1], 'base64'));
                await image.writeAsync(imagePath);
                return nameFile;
            } catch (err) {
                console.error('Lỗi khi lưu ảnh:', err);
                throw err;
            }
        } catch (error) {
            console.log(error)
            console.log(error.message)
        }
    }
};
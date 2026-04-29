const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dzbizu8pe',
    api_key: '826427539544613',
    api_secret: '9kP_0BKziaH7I3rMKgmOKr2v7JU'
});

module.exports = cloudinary;

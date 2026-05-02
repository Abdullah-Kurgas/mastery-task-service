const { FileType } = require("../enums/file-type");

function fileFilter(req, file, cb) {
    const allowedTypes = [
        FileType.PDF,
        FileType.CSV,
        FileType.TXT
    ];

    if (!file) cb(null, false);

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, Images, CSV, and Text are allowed!'), false);
    }
}

module.exports = fileFilter;

const express = require('express');
const multer = require('multer')
const fileFilter = require('../middleware/file-filter');
const documentController = require('../contollers/document-controller');
const router = express.Router();
const upload = multer({ dest: 'uploads/', fileFilter: fileFilter });

router.get('/', documentController.GetDocuments);
router.get('/details/:id', documentController.GetDocumentDetails);
router.post('/upload', upload.single('document'), documentController.UploadDocument);

module.exports = router;
const { DocumentStatus } = require("../enums/document-status");
const { Document } = require("../models/document-model");
const UpdateDocumentDTO = require("../payloads/document-dto");
const cloudinary = require('../config/cloudinary');
const { parseFileDoc, deleteStorageDocument, validateDocument } = require("../services/document-service");

const GetDocuments = async (req, res) => {
    const documents = await Document.find();
    res.send(documents);
}

const GetDocumentDetails = async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        res.status(200).json(document);
    } catch (error) {
        res.status(404).send({ message: 'Document not found' });
    }
}

const UploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const extractedData = await parseFileDoc(req.file);
        const validatedDocument = await validateDocument(extractedData);

        const cloudFile = await cloudinary.uploader.upload(req.file.path, {
            folder: 'mastery_task',
            resource_type: 'auto',
        });
        

        const newDoc = new Document({
            ...validatedDocument,
            path: cloudFile.url
        });

        const savedDoc = await newDoc.save();
        await deleteStorageDocument(req.file);
        res.status(200).json(savedDoc);
    } catch (error) {
        if (req.file) await deleteStorageDocument(req.file);
        res.status(500).json({ message: "Parsing failed", error: error.message });
    }
}

const UpdateDocumentData = async (req, res) => {
    try {
        const validatedReq = UpdateDocumentDTO.parse(req.body);
        const document = await Document.findById(req.params.id);

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        const validatedDocument = await validateDocument(
            { ...document.toObject(), ...validatedReq },
            !validatedReq.documentNumber,
            req.params.id
        );

        if (validatedDocument.status === DocumentStatus.REJECTED) {
            return res.status(400).json({ message: "Document with same number already exists" });
        }

        if (validatedDocument.status === DocumentStatus.NEEDS_REVIEW) {
            return res.status(400).json({ message: "Document data are not valid!" });
        }

        if (validatedDocument.status == DocumentStatus.VALIDATED) {
            Object.assign(document, validatedReq);
        }

        document.status = validatedDocument.status;
        await document.save();
        res.status(200).json(document);
    } catch (error) {
        res.status(400).json({ message: "Update failed", error: error.message });
    }
}


module.exports = {
    GetDocuments,
    GetDocumentDetails,
    UploadDocument,
    UpdateDocumentData
}
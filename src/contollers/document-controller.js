const { DocumentStatus } = require("../enums/document-status");
const { Document } = require("../models/document-model");
const { parseFileDoc, deleteStorageDocument, validateDocument } = require("../services/document-service");

const GetDocuments = async (req, res) => {
    const documents = await Document.find();
    res.send(documents);
}

const GetDocumentDetails = async (req, res) => {
    try {
        const book = await Document.findById(req.params.id);
        res.send(book);
    } catch (error) {
        res.status(404).send({ message: 'Book not found' });
    }
}

const UploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const extractedData = await parseFileDoc(req.file);
        const validatedDocument = await validateDocument(extractedData);
        const newDoc = new Document(validatedDocument);

        const savedDoc = await newDoc.save();
        await deleteStorageDocument(req.file);
        res.status(200).json(savedDoc);
    } catch (error) {
        if (req.file) await deleteStorageDocument(req.file);
        res.status(500).json({ message: "Parsing failed", error: error.message });
    }
}


module.exports = {
    GetDocuments,
    GetDocumentDetails,
    UploadDocument
}
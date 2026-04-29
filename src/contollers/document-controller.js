const { Document } = require("../models/document-model");
const { parseFileDoc, deleteStorageDocument } = require("../services/document-service");

const GetDocuments = (req, res) => {
    res.status(200).json({ message: "Fetched all documents" });
}

const GetDocumentDetails = (req, res) => { }

const UploadDocument = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const extractedData = await parseFileDoc(req.file);
        const newDoc = new Document(extractedData);

        const savedDoc = await newDoc.save();
        await deleteStorageDocument(req.file);
        res.status(200).json({ message: "File saved successfully", data: savedDoc });
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
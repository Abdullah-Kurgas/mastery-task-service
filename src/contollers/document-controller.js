const { parseFileDoc } = require("../services/document-service");



const GetDocuments = (req, res) => {
    res.status(200).json({ message: "Fetched all documents" });
}

const GetDocumentDetails = (req, res) => {


}

const UploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const extractedData = await parseFileDoc(req.file);

        res.status(200).json({
            message: "File parsed successfully",
            data: extractedData
        });
    } catch (error) {
        res.status(500).json({ message: "Parsing failed", error: error.message });
    }
}


module.exports = {
    GetDocuments,
    GetDocumentDetails,
    UploadDocument
}
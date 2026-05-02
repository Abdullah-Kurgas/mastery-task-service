const { PDFParse } = require('pdf-parse');
const csvParser = require('csv-parser');
const fs = require('fs');
const { FileType } = require('../enums/file-type');
const { Document } = require('../models/document-model');
const { DocumentStatus } = require('../enums/document-status');
const { DocumentType } = require('../enums/document-type');

const parseFileDoc = async (file) => {
    const fileName = file.originalname;
    const fileSize = file.size;
    const fileType = file.mimetype;
    const buffer = file.buffer;

    switch (fileType) {
        case FileType.PDF:
            const parser = new PDFParse({ url: file.path });
            const pdfText = (await parser.getText()).text;
            const pdfTable = (await parser.getTable());
            const extractedTableData = extractPDFLineItems(pdfTable.pages[0].tables[0]);
            const extractedData = extractPDFData(pdfText, extractedTableData);

            return {
                ...extractedData,
                name: fileName,
                mediaType: fileType,
                size: fileSize
            };
        case FileType.TXT:
            const parsedTXTFile = await parseTextFile(file);
            const extractedTXTData = extractTXTData(parsedTXTFile);

            return {
                ...extractedTXTData,
                name: fileName,
                mediaType: fileType,
                size: fileSize
            };;
        case FileType.CSV:
            const extractedCSVData = await extractCSVData(file.path);

            return {
                ...extractedCSVData,
                name: fileName,
                mediaType: fileType,
                size: fileSize
            };

        default:
            break;
    }
}

const extractPDFData = (text, lineItems) => {
    const documentType = extractDocumentType(text);
    const supplier = text.match(/Supplier:\s*(.+)/i)?.[1];
    const docNumber = text.match(/Number:\s*([\w-]+)/i)?.[1];
    const issueDate = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i)?.[1];
    const currency = extractCurrency(text);
    const subtotal = text.match(/Subtotal\s*([\d.]+)/i)?.[1];
    const taxPercent = text.match(/(?:tax|vat)\s*\(?([\d.]+)%?\)?\s*([\d.,]+)/i);
    const total = text.match(/^Total\s*([\d.]+)/m)?.[1];

    return {
        documentType: documentType,
        supplier: supplier?.trim(),
        documentNumber: docNumber,
        issueDate: issueDate,
        currency: currency,
        subtotal: parseFloat(subtotal),
        taxPercent: +taxPercent?.[1],
        taxAmount: +taxPercent?.[2],
        totalAmount: parseFloat(total),
        lineItems: manageLineItems(lineItems)
    };
};

const extractPDFLineItems = (table) => {
    const footerIndex = table.findIndex(row =>
        row.some(cell => typeof cell === 'string' && cell.includes("Subtotal"))
    );
    const itemRows = table.slice(1, footerIndex);

    return itemRows.map(row => ({
        description: row[0],
        quantity: Number(row[1]),
        unitPrice: Number(row[2]),
        total: Number(row[3])
    }));
};

const extractCSVData = async (filePath) => {
    const parsedData = await new Promise((resolve, reject) => {
        const lineItems = [];
        let subtotal = 0;
        let totalAmount = 0;
        const taxPercent = 0;
        const taxAmount = 0;

        fs.createReadStream(filePath)
            .pipe(csvParser())
            .on('data', (data) => {
                subtotal += (Number(data?.total) || 0);
                totalAmount += (Number(data?.total) || 0);

                lineItems.push({
                    description: data?.desc,
                    quantity: data?.qty,
                    unitPrice: data?.price,
                    total: data?.total
                });
            }
            )
            .on('end', () => {
                resolve({
                    subtotal: subtotal,
                    taxPercent: taxPercent,
                    taxAmount: taxAmount,
                    totalAmount: totalAmount,
                    lineItems: lineItems
                });
            })
            .on('error', (error) => {
                reject(error);
            });
    });

    return parsedData;
}

const parseTextFile = async (file) => {
    try {
        const fileText = await fs.promises.readFile(file.path, 'utf8');
        const splittedText = fileText.split('\n');

        return splittedText;
    } catch (error) {
        return '';
    }
}

const extractTXTData = (textArray) => {
    const documentType = extractDocumentType(textArray[0]);
    const supplier = textArray[0].split(' ')[1];
    const currency = extractCurrency(textArray[1]);
    const totalAmount = parseFloat(textArray[1].split(' ')?.[1])

    return {
        documentType: documentType,
        supplier: supplier,
        currency: currency,
        totalAmount: totalAmount,
        lineItems: manageLineItems([], totalAmount)
    };
}

const manageLineItems = (lineItems, total) => {
    const lineItem = {
        description: 'Total per document',
        quantity: 1,
        unitPrice: total,
        total: total
    }

    if (lineItems?.length) return lineItems;

    if (!total) return [];
    return [lineItem];
}

const extractDocumentType = (text) => {
    const content = text.toLowerCase();
    const invoicePoints = (content.match(/invoice|inv-\d{4}/g) || []).length;
    const poPoints = (content.match(/purchase order|po-\d{5}/g) || []).length;

    if (invoicePoints > poPoints) {
        return DocumentType.INVOICE;
    } else if (poPoints > invoicePoints) {
        return DocumentType.PURCHASE_ORDER;
    }

    return null;
}

const extractCurrency = (text) => {
    return text.match(/\d\s?([A-Z]{3})/)?.[1] || null;
}

const checkDuplicateDoc = async (docNumber, docId) => {
    if (!docNumber) return false;
    const doc = await Document.exists({ documentNumber: docNumber });

    return docId ? (doc && doc._id != docId) : !!doc;
}

const checkDocDates = (issueDate, dueDate) => {
    if (!issueDate || !dueDate) return false;

    const sDate = new Date(issueDate);
    const eDate = new Date(dueDate);

    return sDate <= eDate;
}

const checkMissingFields = (doc) => {
    const docNum = doc?.documentNumber;
    const documentType = doc?.documentType;
    const supplier = doc?.supplier;
    const currency = doc?.currency;

    if (!docNum || !documentType || !supplier || !currency) return true;
    return false;
}

const checkLineItemsAndTotals = (doc) => {
    const lineItems = doc?.lineItems || [];
    const subtotal = doc?.subtotal;
    const totalAmount = doc?.totalAmount;
    const taxAmount = doc?.taxAmount;
    const taxPercent = doc?.taxPercent;

    let cSubtotal = 0;

    if (!lineItems.length) return false;

    for (let i = 0; i < lineItems.length; i++) {
        const lineItem = lineItems[i];
        const quantity = lineItem?.quantity;
        const price = lineItem?.unitPrice;
        const total = lineItem?.total;

        if (total && (!quantity || !price)) return false;
        if (price * quantity !== total) return false;

        cSubtotal += total;
    }

    if ((subtotal && !totalAmount) || (!subtotal && totalAmount)) return false;
    if (taxAmount && ((taxPercent / 100) * subtotal) != taxAmount) return false;
    if ((subtotal + taxAmount) != totalAmount) return false;
    if (cSubtotal != subtotal) return false;

    return true;
}

const validateDocument = async (doc, ignoreIsDuplicate = false, docId = null) => {
    const missingFields = checkMissingFields(doc);
    const validDates = checkDocDates(doc?.issueDate, doc?.dueDate);
    const validLineItemsAndTotals = checkLineItemsAndTotals(doc);
    const isDuplicate = await checkDuplicateDoc(doc?.documentNumber, docId);
    let isValid = true;

    if (missingFields || !validDates || !validLineItemsAndTotals) {
        doc.status = DocumentStatus.NEEDS_REVIEW;
        isValid = false;
    }

    if (isDuplicate && !ignoreIsDuplicate) {
        doc.status = DocumentStatus.REJECTED;
        isValid = false;
    }

    if (isValid) doc.status = DocumentStatus.VALIDATED;

    return doc;
}

const deleteStorageDocument = async (file) => {
    await fs.promises.unlink(file.path).catch(() => { });
}

module.exports = { parseFileDoc, deleteStorageDocument, validateDocument };
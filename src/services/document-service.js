const { PDFParse } = require('pdf-parse');
const csvParser = require('csv-parser');
const fs = require('fs');
const { FileType } = require('../enums/file-type');

const parseFileDoc = async (file) => {
    const fileType = file.mimetype;
    const buffer = file.buffer;

    switch (fileType) {
        case FileType.PDF:
            const parser = new PDFParse({ url: file.path });
            const pdfText = (await parser.getText()).text;
            const pdfTable = (await parser.getTable());
            const extractedTableData = extractPDFLineItems(pdfTable.pages[0].tables[0]);
            const extractedData = extractPDFData(pdfText, extractedTableData);

            return extractedData;
        case FileType.TXT:


            return {};
        case FileType.CSV:
            const extractedCSVData = await extractCSVData(file.path);

            return extractedCSVData;

        default:
            break;
    }
}

const extractPDFData = (text, lineItems) => {
    const documentType = text.match(/(.+)/i)?.[0];
    const supplier = text.match(/Supplier:\s*(.+)/i)?.[1];
    const docNumber = text.match(/Number:\s*([\w-]+)/i)?.[1];
    const issueDate = text.match(/Date:\s*(\d{4}-\d{2}-\d{2})/i)?.[1];
    const subtotal = text.match(/Subtotal\s*([\d.]+)/i)?.[1];
    const taxPercent = text.match(/Tax\s*\((.+)\)\s*([\d.]+)/i);
    const total = text.match(/^Total\s*([\d.]+)/m)?.[1];

    return {
        documentType: documentType,
        supplier: supplier?.trim(),
        documentNumber: docNumber,
        issueDate: issueDate,
        subtotal: parseFloat(subtotal),
        taxPercent: taxPercent?.[1],
        taxAmount: parseFloat(taxPercent?.[2]),
        totalAmount: parseFloat(total),
        lineItems: lineItems
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
        const taxPercent = '0%';
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


const deleteStorageDocument = async (file) => {
    await fs.promises.unlink(file.path).catch(() => { });
}

module.exports = { parseFileDoc, deleteStorageDocument };
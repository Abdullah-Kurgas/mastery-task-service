const mongoose = require('mongoose');
const { DocumentStatus } = require('../enums/document-status');
const { Schema } = mongoose;

const lineItemSchema = new Schema({
    description: { type: String, default: null },
    quantity: { type: Number, default: null },
    unitPrice: { type: Number, default: null },
    total: { type: Number, default: null }
}, { _id: false });

const documentSchema = new Schema({
    name: String,
    path: String,
    documentType: { type: String, default: null },
    supplier: { type: String, default: null },
    documentNumber: { type: String, default: null },
    issueDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    currency: { type: String, default: null },
    subtotal: { type: Number, default: null },
    taxAmount: { type: Number, default: null },
    taxPercent: { type: Number, default: null },
    totalAmount: { type: Number, default: null },
    status: { type: String, default: DocumentStatus.UPLOADED },
    mediaType: String,
    size: Number,
    lineItems: [lineItemSchema],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Document = mongoose.model('Document', documentSchema);

module.exports = { Document };
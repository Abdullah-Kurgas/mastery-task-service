const mongoose = require("mongoose");
const { DocumentStatus } = require("../enums/document-status");
const { DocumentType } = require("../enums/document-type");
const { FileType } = require("../enums/file-type");
const { Schema } = mongoose;

const lineItemSchema = new Schema(
  {
    description: { type: String, default: null },
    quantity: { type: Number, default: null },
    unitPrice: { type: Number, default: null },
    total: { type: Number, default: null },
  },
  { _id: false },
);

const documentSchema = new Schema({
  name: { type: String, immutable: true },
  path: { type: String, immutable: true },
  documentType: {
    type: String,
    enum: [DocumentType.INVOICE, DocumentType.PURCHASE_ORDER],
    default: null,
  },
  supplier: { type: String, default: null },
  documentNumber: { type: String, default: null },
  issueDate: {
    type: String,
    match: [/^\d{4}-\d{2}-\d{2}$/, "Please use YYYY-MM-DD format"],
    default: null,
  },
  dueDate: {
    type: String,
    match: [/^\d{4}-\d{2}-\d{2}$/, "Please use YYYY-MM-DD format"],
    default: null,
  },
  currency: {
    type: String,
    match: [/^([A-Z]{3})$/, "Please use currency format"],
    required: false,
    default: null,
  },
  subtotal: { type: Number, default: null },
  taxAmount: { type: Number, default: null },
  taxPercent: { type: Number, default: null },
  totalAmount: { type: Number, default: null },
  status: {
    type: String,
    enum: [
      DocumentStatus.UPLOADED,
      DocumentStatus.NEEDS_REVIEW,
      DocumentStatus.VALIDATED,
      DocumentStatus.REJECTED,
    ],
    default: DocumentStatus.UPLOADED,
  },
  mediaType: {
    type: String,
    enum: [
      FileType.CSV,
      FileType.IMAGEJPEG,
      FileType.IMAGEPNG,
      FileType.TXT,
      FileType.PDF,
    ],
    immutable: true,
  },
  size: { type: Number, immutable: true },
  lineItems: [lineItemSchema],
  createdAt: { type: Date, default: Date.now, immutable: true },
  updatedAt: { type: Date, default: Date.now },
});

const Document = mongoose.model("Document", documentSchema);

module.exports = { Document };

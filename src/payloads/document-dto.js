const { z } = require('zod');


const UpdateDocumentDTO = z.object({
    documentType: z.string().trim().optional(),
    supplier: z.string().trim().optional(),
    documentNumber: z.string().trim().optional(),
    issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    currency: z.string().trim().optional(),
    subtotal: z.number().optional(),
    taxAmount: z.number().optional(),
    taxPercent: z.number().optional(),
    totalAmount: z.number().optional(),
    lineItems: z.array(
        z.object({
            description: z.string().trim().min(2),
            quantity: z.number().min(1),
            unitPrice: z.number().min(1),
            total: z.number().min(1)
        })
    ).optional()
}).strict();

module.exports = UpdateDocumentDTO;
import htmlToPdf from "html-pdf-node";
import fs from "fs";
import path from "path";
import { buildInvoiceHTML } from "./invoice.html.js";

export const generateInvoicePdf = async ({ data, filename }) => {
    const html = buildInvoiceHTML(data);

    const file = { content: html };

    const options = {
        format: "A4",
        landscape: true,
        margin: {
            top: "10mm",
            bottom: "10mm",
            left: "10mm",
            right: "10mm"
        },
        printBackground: true
    };

    // 📁 Asegurar directorio
    const outputDir = path.resolve("storage/pdf");
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const pdfBuffer = await htmlToPdf.generatePdf(file, options);

    const outputPath = path.join(outputDir, filename);
    fs.writeFileSync(outputPath, pdfBuffer);

    return outputPath;
};
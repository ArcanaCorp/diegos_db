import { generateSignatureInvoice } from "#src/services/invoice.service.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";
import { buildInvoiceDTO } from "#src/helpers/invoice.dto.js";
import { generateInvoicePdf } from "#src/utils/invoice.pdf.js";

export const generateInvoice = async (req, res) => {
    try {
        const { empresa, cliente, venta, items } = req.body;

        if (!empresa || !cliente || !venta || !items) {
            return res.status(400).json({
                ok: false,
                message: "Datos incompletos",
                status: STATUS_CODE.BAD_REQUEST
            });
        }

        const form = { empresa, cliente, venta, items };

        const sunatResponse = await generateSignatureInvoice(form);

        const invoiceDTO = buildInvoiceDTO({
            form,
            sunat: sunatResponse
        });

        const filename = `Factura-${venta.serie}-${venta.numero}.pdf`;

        // 🔥 ACÁ GENERAS TU PDF PROPIO
        const pdfPath = await generateInvoicePdf({
            data: invoiceDTO,
            filename
        })

        return res.status(200).json({
            ok: true,
            message: sunatResponse.respuesta_sunat_descripcion,
            data: invoiceDTO,
            file: pdfPath,
            status: STATUS_CODE.SUCCESS
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error interno del servidor",
            error: error.message,
            status: STATUS_CODE.SERVER_ERROR
        });
    }
};
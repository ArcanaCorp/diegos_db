export const buildInvoiceDTO = ({ form, sunat }) => {
    const { empresa, cliente, venta, items } = form;

    return {
        empresa,
        cliente,
        comprobante: {
            tipo: venta.tipo_documento_codigo,
            serie: venta.serie,
            numero: venta.numero,
            fecha: venta.fecha_emision,
            hora: venta.hora_emision,
            moneda: venta.moneda_id === "2" ? "USD" : "PEN"
        },
        items: items.map(i => ({
            descripcion: i.producto,
            cantidad: Number(i.cantidad),
            precio: Number(i.precio_base),
            subtotal: Number(i.cantidad) * Number(i.precio_base)
        })),
        totales: {
            gravada: Number(venta.total_gravada),
            igv: Number(venta.total_igv),
            total: Number(venta.total_gravada) + Number(venta.total_igv)
        },
        sunat: {
            hash: sunat.codigo_hash,
            xmlUrl: sunat.ruta_xml,
            cdrUrl: sunat.ruta_cdr,
            xmlBase64: sunat.xml_base_64,
            cdrBase64: sunat.cdr_base_64
        }
    };
};
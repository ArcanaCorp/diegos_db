export const buildInvoiceHTML = (invoice) => {

    console.log(invoice);
    const { empresa, cliente, comprobante, totales, items, sunat = {} } = invoice;

    const toNumber = (v) => Number(v || 0);

    return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Factura ${comprobante.serie}-${comprobante.numero}</title>
<style>
    body { font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #333; }
    .container { width: calc(100% - 20mm); padding: 24px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .empresa { max-width: 60%; }
    .empresa h2 { margin: 0; }
    .comprobante { border: 2px solid #000; padding: 10px; text-align: center; }
    .section { margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #000; padding: 6px; }
    th { background: #f4f4f4; }
    .totales { width: 40%; float: right; margin-top: 20px; }
    .totales td:last-child { text-align: right; }
    .footer { margin-top: 60px; font-size: 10px; border-top: 1px solid #ccc; padding-top: 10px; }
</style>
</head>

<body>
<div class="container">

<div class="header">
    <div class="empresa">
        <h2>${empresa.razon_social}</h2>
        <p>
            <strong>RUC:</strong> ${empresa.ruc}<br/>
            ${empresa.domicilio_fiscal}<br/>
            ${empresa.distrito} - ${empresa.provincia} - ${empresa.departamento}
        </p>
    </div>

    <div class="comprobante">
        <strong>FACTURA ELECTRÓNICA</strong><br/>
        ${comprobante.serie}-${comprobante.numero}<br/><br/>
        Fecha: ${comprobante.fecha}<br/>
        Hora: ${comprobante.hora}<br/>
        Moneda: ${comprobante.moneda_id === '2' ? 'USD' : 'PEN'}
    </div>
</div>

<div class="section">
    <strong>Cliente:</strong><br/>
    ${cliente.razon_social_nombres}<br/>
    Documento: ${cliente.numero_documento}<br/>
    Dirección: ${cliente.cliente_direccion || '-'}
</div>

<div class="section">
<table>
<thead>
<tr>
    <th>#</th>
    <th>Descripción</th>
    <th>Cant.</th>
    <th>Precio</th>
    <th>Subtotal</th>
</tr>
</thead>
<tbody>
${items.map((item, index) => {
    const cantidad = toNumber(item.cantidad);
    const precio = toNumber(item.precio);
    const subtotal = cantidad * precio;

    return `
<tr>
    <td>${index + 1}</td>
    <td>${item.descripcion}</td>
    <td>${cantidad}</td>
    <td>${precio.toFixed(2)}</td>
    <td>${subtotal.toFixed(2)}</td>
</tr>`;
}).join('')}
</tbody>
</table>
</div>

<table class="totales">
<tr>
    <td>Op. Gravada</td>
    <td>${toNumber(totales.gravada).toFixed(2)}</td>
</tr>
<tr>
    <td>IGV</td>
    <td>${toNumber(totales.igv).toFixed(2)}</td>
</tr>
<tr>
    <td><strong>Total</strong></td>
    <td><strong>${(toNumber(totales.total)).toFixed(2)}</strong></td>
</tr>
</table>

<div style="clear: both;"></div>

<div class="footer">
    Código Hash: ${sunat.hash || '---'}<br/>
    Documento autorizado por SUNAT
</div>

</div>
</body>
</html>`;
};
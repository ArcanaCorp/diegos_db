import { ENDPOINT_SUNAT } from "#src/config.js";

export const generateSignatureInvoice = async (form) => {
    const response = await fetch(ENDPOINT_SUNAT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Error SUNAT');
    }

    return data.data; // SOLO DATA
};
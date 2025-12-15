import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const getInputs = async (req, res) => {
    try {

        const sql = `SELECT * FROM inputs WHERE active_input = 1 ORDER BY name_input ASC`;
        const [inputs] = await pool.query(sql);

        if (inputs.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No hay insumos registrados",
                data: [],
                status: STATUS_CODE.NOT_FOUND,
                code: 404
            });
        }

        const normalized = inputs.map(i => ({
            id: i.id_input,
            code: i.code_input,
            name: i.name_input,
            category: i.category_input,
            unit: i.unit_input,
            unitBase: i.unit_base_input,
            stock: Number(i.stock_input),
            minStock: Number(i.min_stock_input),
            costUnit: Number(i.cost_unit_input),
            mermaPercent: Number(i.merma_percent_input),
            supplier: i.supplier_input,
            expiration: i.expiration_input,
            active: Boolean(i.active_input),
            createdAt: i.created_input,
            updatedAt: i.updated_input
        }));

        return res.status(200).json({
            ok: true,
            message: "Insumos listados correctamente",
            data: normalized,
            status: STATUS_CODE.SUCCESS,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: `Error interno del servidor`,
            data: [],
            error: error.message,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        });
    }
};
import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

const PRODUCT_QUERIES_BY_ROLE = {
    ADMIN: {
        sql: `SELECT * FROM products ORDER BY id_product DESC`,
        needsStore: false
    },
    TIENDA: {
        sql: `SELECT p.*, pbs.amount_by_store FROM product_by_store pbs INNER JOIN products p ON p.code_product = pbs.code_product WHERE pbs.store_id = ? ORDER BY p.id_product DESC`,
        needsStore: true
    }
};

export const getProducts = async (req, res) => {
    
    try {
        
        const { user_code } = req.user;
        if (!user_code) return res.status(404).json({ok: false, message: 'No se recibió al usuario', data: [], error: '', status: STATUS_CODE.NOT_FOUND, code: 404});

        const sqlUser = 'SELECT * FROM users WHERE code_user = ?';
        const [ validUser ] = await pool.query(sqlUser, [user_code]);

            if (validUser.length === 0) return res.status(404).json({ok: false, message: 'No hay usuario', data: [], error: '', status: STATUS_CODE.NOT_FOUND, code: 404});

                const user = validUser[0];
                const strategy = PRODUCT_QUERIES_BY_ROLE[user.role_user];

                if (!strategy) {
                    return res.status(403).json({
                        ok: false,
                        message: "Rol sin permisos para listar productos",
                        data: [],
                        status: STATUS_CODE.UNAUTHORIZED
                    });
                }

                const params = strategy.needsStore ? [user.code_user] : [];
                const [products] = await pool.query(strategy.sql, params);

                if (products.length === 0) return res.status(404).json({ok: false, message: "No hay productos disponibles", data: [], status: STATUS_CODE.NOT_FOUND});
                    
                    const normalized = products.map((p) => {
                        return {
                            id: p.id_product,
                            code: p.code_product,
                            category: p.category_product,
                            name: p.name_product,
                            price: p.uprice_product,
                            dprice: p.dprice_product,
                            text: p.text_product,
                            amountByStore: p.amount_by_store || 0,
                            date: p.date_product
                        }
                    })

                    return res.status(200).json({ok: true, message: 'Productos listados', data: normalized, error: '', status: STATUS_CODE.SUCCESS, code: 200})

    } catch (error) {
        return res.status(500).json({ok: false, message: `Error: ${error.message}`, data: [], error: error, status: STATUS_CODE.SERVER_ERROR, code: 500})
    }

}

export const updateProduct = async (req, res) => {

    try {

        const { id } = req.params;
        const { field, value } = req.body;

        // Validaciones rápidas
        if (!id || !field || value === undefined) {
            return res.status(400).json({
                ok: false,
                message: "Datos incompletos para actualizar el producto.",
                error: '',
                status: STATUS_CODE.BAD_REQUEST,
            });
        }

        const fieldMap = {
            "category_product": "category",
            "name_product": "name",
            "uprice_product": "price",
            "dprice_product": "dprice",
            "text_product": "text"
        };

        // Validación contra inyección SQL
        if (!fieldMap[field]) {
            return res.status(400).json({
                ok: false,
                status: STATUS_CODE.BAD_REQUEST,
                message: `El campo '${field}' no es actualizable.`,
                error: ''
            });
        }

        const query = `UPDATE products SET ${field} = ? WHERE id_product = ?`;

        const [result] = await pool.query(query, [value, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                status: STATUS_CODE.NOT_FOUND,
                message: "Producto no encontrado."
            });
        }

        return res.status(200).json({
            ok: true,
            status: STATUS_CODE.SUCCESS,
            message: "Producto actualizado correctamente.",
            error: '',
            updated: {
                id: id,
                field: fieldMap[field],
                value
            }
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error: error,
            message: "Error interno del servidor.",
            status: STATUS_CODE.SERVER_ERROR,
        });
    }

}

export const deleteProduct = async (req, res) => {

    try {
    
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                ok: false,
                message: "ID de producto no proporcionado.",
                error: '',
                status: STATUS_CODE.BAD_REQUEST
            });
        }

        const sql = 'DELETE FROM products WHERE id_product = ?';
        const [result] = await pool.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                status: STATUS_CODE.NOT_FOUND,
                message: "Producto no encontrado.",
                error: ''
            });
        }

        return res.status(200).json({
            ok: true,
            status: STATUS_CODE.SUCCESS,
            message: "Producto eliminado correctamente.",
            error: '',
            deleted: {
                id: id
            }
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            error,
            message: "Error interno del servidor.",
            status: STATUS_CODE.SERVER_ERROR
        });
    }
};
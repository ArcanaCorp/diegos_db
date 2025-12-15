import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const getProducts = async (req, res) => {

    try {
        
        const sql = 'SELECT * FROM product_by_store WHERE store_id = ?';
        const [ rows ] = await pool.query(sql)

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: `Error: ${error.message}`,
            error,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        });
    }

}
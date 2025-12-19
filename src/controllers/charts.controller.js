import { pool } from "#src/db/db.js";
import { formatDay, formatHour, formatMonth } from "#src/helpers/date_format.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

const QUERIES = {
    hour: `
        SELECT 
            DATE_FORMAT(fecha_sales, '%H:00') AS hora,
            SUM(total_sales) AS total
        FROM sales
        WHERE DATE(fecha_sales) = CURDATE()
        GROUP BY hora
        ORDER BY hora
    `,
    day: `
        SELECT 
            DATE(fecha_sales) AS dia,
            SUM(total_sales) AS total
        FROM sales
        WHERE fecha_sales >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY dia
        ORDER BY dia
    `,
    month: `
        SELECT 
            DATE_FORMAT(fecha_sales, '%Y-%m') AS mes,
            SUM(total_sales) AS total
        FROM sales
        WHERE YEAR(fecha_sales) = YEAR(CURDATE())
        GROUP BY mes
        ORDER BY mes
    `
};

export const getSalesStats = async (req, res) => {
    try {
        const { type } = req.query;

        if (!type || !QUERIES[type]) {
            return res.status(400).json({
                ok: false,
                message: "Tipo de estadística inválido",
                data: [],
                error: STATUS_CODE.BAD_REQUEST,
                status: STATUS_CODE.BAD_REQUEST,
                code: 400
            });
        }

        const [rows] = await pool.query(QUERIES[type]);

        const formattedRows = rows.map((r) => {
            return {
                total: r.total,
                label: type === "hour"
                    ? formatHour(r.hora)
                    : type === "day"
                        ? formatDay(r.dia)
                        : formatMonth(r.mes)
            }
        })

        return res.status(200).json({
            ok: true,
            message: "Estadísticas obtenidas correctamente",
            data: formattedRows,
            error: "",
            status: STATUS_CODE.SUCCESS,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error interno del servidor",
            data: [],
            error: error.message,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        });
    }
};
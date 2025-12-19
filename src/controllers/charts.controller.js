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

const buildWhere = (field, store) => {
    if (!store) return { sql: "", params: [] }
    return { sql: ` AND ${field} = ? `, params: [store] }
}

const SUMMARY_BASE = {
    todaySales: `
        SELECT COALESCE(SUM(total_sales), 0) AS total
        FROM sales
        WHERE DATE(fecha_sales) = CURDATE()
    `,
    yesterdaySales: `
        SELECT COALESCE(SUM(total_sales), 0) AS total
        FROM sales
        WHERE DATE(fecha_sales) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `,
    todayTransactions: `
        SELECT COUNT(*) AS total
        FROM sales
        WHERE DATE(fecha_sales) = CURDATE()
    `,
    yesterdayTransactions: `
        SELECT COUNT(*) AS total
        FROM sales
        WHERE DATE(fecha_sales) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `,
    todayProducts: `
        SELECT COALESCE(SUM(ps.amount_product_sale), 0) AS total
        FROM product_sales ps
        JOIN sales s ON s.id_sales = ps.id_sales
        WHERE DATE(s.fecha_sales) = CURDATE()
    `,
    yesterdayProducts: `
        SELECT COALESCE(SUM(ps.amount_product_sale), 0) AS total
        FROM product_sales ps
        JOIN sales s ON s.id_sales = ps.id_sales
        WHERE DATE(s.fecha_sales) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
    `,
    alerts: `
        SELECT COUNT(*) AS total
        FROM product_by_store
        WHERE amount_by_store <= 5
    `
}

const getTrend = (today, yesterday) => {
    if (yesterday === 0 && today > 0) {
        return { value: 100, type: "up" }
    }

    if (yesterday === 0) {
        return { value: 0, type: "down" }
    }

    const diff = ((today - yesterday) / yesterday) * 100

    return {
        value: Math.round(Math.abs(diff)),
        type: diff >= 0 ? "up" : "down"
    }
}

export const getSummaryStats = async (req, res) => {
    try {
        const { store } = req.query

        const salesWhere = buildWhere("headquarter_sales", store)
        const productSalesWhere = buildWhere("s.headquarter_sales", store)
        const alertWhere = store
            ? { sql: " AND store_id = ?", params: [store] }
            : { sql: "", params: [] }

        const [
            [[todaySales]],
            [[yesterdaySales]],
            [[todayTx]],
            [[yesterdayTx]],
            [[todayProducts]],
            [[yesterdayProducts]],
            [[alerts]]
        ] = await Promise.all([
            pool.query(SUMMARY_BASE.todaySales + salesWhere.sql, salesWhere.params),
            pool.query(SUMMARY_BASE.yesterdaySales + salesWhere.sql, salesWhere.params),
            pool.query(SUMMARY_BASE.todayTransactions + salesWhere.sql, salesWhere.params),
            pool.query(SUMMARY_BASE.yesterdayTransactions + salesWhere.sql, salesWhere.params),
            pool.query(SUMMARY_BASE.todayProducts + productSalesWhere.sql, productSalesWhere.params),
            pool.query(SUMMARY_BASE.yesterdayProducts + productSalesWhere.sql, productSalesWhere.params),
            pool.query(SUMMARY_BASE.alerts + alertWhere.sql, alertWhere.params)
        ])

        const data = [
            {
                title: "Ventas del día",
                value: Number(todaySales.total),
                prefix: "S/",
                description: "Total vendido hoy",
                trend: getTrend(todaySales.total, yesterdaySales.total)
            },
            {
                title: "N° de ventas del día",
                value: todayTx.total,
                description: "Transacciones procesadas",
                trend: getTrend(todayTx.total, yesterdayTx.total)
            },
            {
                title: "Productos vendidos",
                value: todayProducts.total,
                description: "Unidades totales vendidas",
                trend: getTrend(todayProducts.total, yesterdayProducts.total)
            },
            {
                title: "Alertas activas",
                value: alerts.total,
                description: "Stock en mínimo o agotado",
                trend: {
                    value: alerts.total,
                    type: alerts.total > 0 ? "up" : "down"
                }
            }
        ]

        return res.status(200).json({
            ok: true,
            message: store
                ? "Resumen por sede obtenido correctamente"
                : "Resumen global obtenido correctamente",
            data,
            error: "",
            status: STATUS_CODE.SUCCESS,
            code: 200
        })

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: "Error interno del servidor",
            data: [],
            error: error.message,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        })
    }
}
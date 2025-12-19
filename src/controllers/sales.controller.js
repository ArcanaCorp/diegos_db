import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const getSales = async (req, res) => {
    try {

        const sql = `SELECT 
                s.id_sales,
                s.headquarter_sales,
                u.name_user AS headquarter_name,
                s.payment_sales,
                s.total_sales,
                s.note_sales,
                s.fecha_sales,

                CONCAT(
                    '[',
                    IFNULL(
                        GROUP_CONCAT(
                            JSON_OBJECT(
                                'id', ps.id_product_sale,
                                'name', ps.name_product_sale,
                                'amount', ps.amount_product_sale,
                                'subtotal', ps.subtotal_product_sale,
                                'created_at', ps.created_product_sale
                            )
                            ORDER BY ps.created_product_sale
                            SEPARATOR ','
                        ),
                        ''
                    ),
                    ']'
                ) AS products

            FROM sales s

            INNER JOIN users u
                ON u.code_user = s.headquarter_sales

            LEFT JOIN product_sales ps
                ON ps.id_sales = s.id_sales

            GROUP BY 
                s.id_sales,
                s.headquarter_sales,
                u.name_user,
                s.payment_sales,
                s.total_sales,
                s.note_sales,
                s.fecha_sales

            ORDER BY s.id_sales DESC;
        `

        const [rows] = await pool.query(sql);

        const formattedRows = rows.map(row => ({
            id: row.id_sales,
            store: row.headquarter_name,
            payment: row.payment_sales,
            total: Number(row.total_sales),
            note: row.note_sales,
            date: row.fecha_sales,
            products: JSON.parse(row.products || '[]').map(p => ({
                id: p.id_product_sale,
                name: p.name,
                quantity: p.amount,
                subtotal: Number(p.subtotal),
                createdAt: p.created_at
            }))
        }));

        return res.status(200).json({
            ok: true,
            data: formattedRows,
            status: STATUS_CODE.SUCCESS
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

export const registerSale = async (req, res) => {

    const connection = await pool.getConnection();

    try {
        const { store, products, payment, note = "", date } = req.body;

        // 🧱 Validaciones base
        if (!store || !payment || !date || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({
                ok: false,
                message: "Datos incompletos o inválidos",
                status: STATUS_CODE.BAD_REQUEST
            });
        }

        // 🏪 Validar tienda
        const [storeSql] = await connection.query(`SELECT * FROM users WHERE code_user = ?`, [store]);

        if (storeSql.length === 0) {
            return res.status(404).json({
                ok: false,
                message: "No se encontró la tienda",
                status: STATUS_CODE.NOT_FOUND
            });
        }

        const storeInfo = storeSql[0];

        // 🧮 Total calculado SIEMPRE en backend
        const calculatedTotal = products.reduce(
            (sum, p) => sum + Number(p.subtotal || 0),
            0
        );

        // 🔐 INICIO TRANSACCIÓN
        await connection.beginTransaction();

        // 1️⃣ VALIDAR + DESCONTAR STOCK (BLOQUEO REAL)
        for (const p of products) {

            if (!p.code || !p.name || p.quantity <= 0 || p.subtotal <= 0) {
                throw new Error("Producto inválido en la venta");
            }

            const [stockRows] = await connection.query(`SELECT amount_by_store FROM product_by_store WHERE store_id = ? AND code_product = ? FOR UPDATE`, [store, p.code]);

            if (stockRows.length === 0) {
                throw new Error(`Producto ${p.name} no existe en la tienda`);
            }

            if (stockRows[0].amount_by_store < p.quantity) {
                throw new Error(`Stock insuficiente para ${p.name}`);
            }

            await connection.query(`UPDATE product_by_store SET amount_by_store = amount_by_store - ? WHERE store_id = ? AND code_product = ?`, [p.quantity, store, p.code]);
        }

        // 2️⃣ INSERTAR VENTA
        const [saleResult] = await connection.query(`INSERT INTO sales (headquarter_sales, payment_sales, total_sales, note_sales, fecha_sales) VALUES (?, ?, ?, ?, ?)`, [store, payment, calculatedTotal, note, date]);

        const saleId = saleResult.insertId;

        // 3️⃣ INSERTAR DETALLE DE VENTA
        const productValues = products.map(p => [
            saleId,
            p.name,
            p.quantity,
            p.subtotal
        ]);

        await connection.query(`INSERT INTO product_sales (id_sales, name_product_sale, amount_product_sale, subtotal_product_sale) VALUES ?`, [productValues]);

        // ✅ COMMIT FINAL
        await connection.commit();

        // 🎯 RESPUESTA FINAL
        return res.status(201).json({
            ok: true,
            message: "Venta registrada correctamente",
            status: STATUS_CODE.SUCCESS,
            data: {
                id: saleId,
                store: storeInfo.name_user,
                payment,
                total: calculatedTotal,
                note,
                date,
                products: products.map((p, i) => ({
                    id: i + 1, // solo frontend
                    code: p.code,
                    name: p.name,
                    quantity: p.quantity,
                    subtotal: Number(p.subtotal),
                    createdAt: date
                }))
            }
        });

    } catch (error) {
        await connection.rollback();
        return res.status(500).json({
            ok: false,
            message: error.message || "Error interno del servidor",
            status: STATUS_CODE.SERVER_ERROR
        });
    } finally {
        connection.release();
    }
};
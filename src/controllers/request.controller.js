import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const newRequest = async (req, res) => {
    try {
        const { type, title, message, payload = {}, target_user = null, store_id } = req.body;

        // 👉 normalmente viene del token
        const created_by = req.user?.user_code;

        // 🔎 Validaciones mínimas (sin vueltas)
        if (!type || !title || !message || !store_id || !created_by) {
            return res.status(400).json({
                ok: false,
                message: "Datos incompletos para crear la solicitud",
                status: STATUS_CODE.BAD_REQUEST
            });
        }

        const sql = `INSERT INTO requests (type_request, title_request, message_request, payload_request, created_by, target_user, store_id) VALUES (?, ?, ?, ?, ?, ?, ?)`

        const [result] = await pool.query(sql, [type, title, message, JSON.stringify(payload), created_by, target_user, store_id]);

        return res.status(201).json({
            ok: true,
            message: "Solicitud creada correctamente",
            data: {
                id_request: result.insertId,
                type,
                title,
                message,
                payload,
                status: "PENDING"
            },
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

}
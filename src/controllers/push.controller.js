import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const controllerSubscribePush = async (req, res) => {
    try {
        const { subscription } = req.body;
        const userId = req.user.user_code; // desde JWT

        if (!subscription) return res.status(400).json({ ok: false, message: 'No se recibió la subscripción', data: [], error: STATUS_CODE.NOT_FOUND, status: STATUS_CODE.NOT_FOUND, code: 400 });

        const { endpoint, keys } = subscription;

        const sql = `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?)`;

        await pool.query(sql, [userId, endpoint, keys.p256dh, keys.auth]);

        return res.status(200).json({ ok: true, message: 'Se subscribió las push notificaciones', data: [], error: '', status: STATUS_CODE.SUCCESS, code: 200 });

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
}
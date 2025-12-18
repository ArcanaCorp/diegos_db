// services/push.service.js
import webpush from "#src/config/webpush.js";
import { pool } from "#src/db/db.js";

// payload = { title, body, icon?, badge?, url? }
export const notifyUsersByRole = async (role, payload) => {
  
    const [rows] = await pool.query(`SELECT ps.endpoint, ps.p256dh, ps.auth FROM push_subscriptions ps JOIN users u ON u.user_code = ps.user_id WHERE u.role = ?`, [role]);

    for (const row of rows) {
        const subscription = {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth }
        };
        try {
            await webpush.sendNotification(subscription, JSON.stringify(payload));
        } catch (error) {
            console.error("❌ Error enviando push:", error);
        }
    }
};
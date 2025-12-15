import jwt from "jsonwebtoken";
import { JWT_SECRET, REFRESH_THRESHOLD_SEC } from "#src/config.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

export const verifyToken = (req, res, next) => {
    try {

        const authHeader = req.headers.authorization || req.headers.Authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                ok: false,
                message: "Token no proporcionado",
                error: "TOKEN_REQUIRED",
                status: STATUS_CODE.UNAUTHORIZED,
                code: 401
            });
        }

        const token = authHeader.split(" ")[1];

        let decoded;
        try {
            decoded = jwt.verify(token, JWT_SECRET);
        } catch (err) {
            const isExpired = err.name === "TokenExpiredError";
            return res.status(401).json({
                ok: false,
                message: isExpired ? "Token expirado" : "Token inválido",
                error: isExpired ? "TOKEN_EXPIRED" : "TOKEN_INVALID",
                status: STATUS_CODE.UNAUTHORIZED,
                code: 401
            });
        }

        // decoded.exp is seconds since epoch
        const nowSec = Math.floor(Date.now() / 1000);
        const expSec = decoded.exp || 0;
        const secondsLeft = expSec - nowSec;

        // umbral configurable (en segundos). default 3600s = 1h
        const threshold = Number(REFRESH_THRESHOLD_SEC || 3600);

        // Adjuntamos datos del token a req.user
        req.user = decoded;

        // Si queda menos de threshold, generamos token renovado
        if (secondsLeft > 0 && secondsLeft <= threshold) {
            // Crea nuevo token con la misma carga (puedes filtrar claims si quieres)
            const payload = {
                user_code: decoded.code_user,
            };

            const refreshedToken = jwt.sign(payload, JWT_SECRET, { expiresIn: "12h" });

            // Deja el token renovado disponible para la ruta y añade header
            req.refreshedToken = refreshedToken;
            // Enviar en header con prefijo Bearer (frontend lo tomará fácilmente)
            res.setHeader("x-refresh-token", `Bearer ${refreshedToken}`);
        }

        return next();

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: `Error en validación de token`,
            error: error.message,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        });
    }
};
import dotenv from "dotenv";

dotenv.config();

export const {
    PORT,
    PORT_DB,
    HOST_DB,
    USER_DB,
    PASSWORD_DB,
    DATABASE_DB,
    REFRESH_THRESHOLD_SEC,
    NODE_ENV,
    INSTANCIA_FACTILIZA,
    ENDPOINT,
    JWT_SECRET,
    API_FACTILIZA_WHATSAPP,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
    ENDPOINT_SUNAT
} = process.env;
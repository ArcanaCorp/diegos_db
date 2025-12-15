import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { pool } from "#src/db/db.js";
import { JWT_SECRET } from "#src/config.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

//table users: id_user, code_user, name_user, password_user, role_user, updated_user, date_user

export const login = async (req, res) => {

    const { name, pwd } = req.body;

    if (!name || !pwd) return res.status(400).json({ok: false, message: `Usuario y contraseña son obligatorios`, error: 'LOGIN_BAD_REQUEST', status: STATUS_CODE.BAD_REQUEST, code: 400});

    try {
        
        //table users: id_user, code_user, name_user, password_user, role_user, updated_user, date_user

        const sqlValidateUser = 'SELECT * FROM users WHERE name_user = ? LIMIT 1'
        const [ validateUser ] = await pool.query(sqlValidateUser, [name])
        if (validateUser.length === 0) return res.status(404).json({ok: false, message: `Usuario no encontrado`, error: 'USER_NOT_FOUND', status: STATUS_CODE.NOT_FOUND, code: 404})

            const user = validateUser[0];

        // 3. Comparar contraseña
        const passwordsMatch = await bcrypt.compare(pwd, user.password_user);
        if (!passwordsMatch) return res.status(401).json({ok: false, message: `Credenciales incorrectas`, error: 'INVALID_PASSWORD', status: STATUS_CODE.UNAUTHORIZED, code: 401});

            const payload = {
                user_code: user.code_user
            }

            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' })

            return res.status(200).json({ok: true, message: 'Inicio de sesión existoso', role: user.role_user, data: token, error: '', status: STATUS_CODE.SUCCESS, code: 200})

    } catch (error) {
        return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, status: STATUS_CODE.SERVER_ERROR, code: 500})
    }

}

export const account = async (req, res) => {

    const { user_code } = req.user;

    if (!user_code) return res.status(400).json({ok: false, message: 'No se encontró el user_code', error: 'NOT_FOUND_USER_CODE', status: STATUS_CODE.NOT_FOUND, code: 400})

    try {
        
        const sql = `SELECT * FROM users WHERE code_user = ? LIMIT 1`
        const [ rows ] = await pool.query(sql, [ user_code ]);
        if (rows.length === 0) return res.status(404).json({ok: false, message: `Usuario no encontrado`, error: 'ACCOUNT_NOT_FOUND', status: STATUS_CODE.NOT_FOUND, code: 404})

            const user = rows[0];
            const refreshedToken = req.refreshedToken || null;

            const normalizer = {
                id: user.id_user,
                code: user.code_user,
                name: user.name_user,
                role: user.role_user,
                update: user.updated_user,
                created: user.date_user
            }

            const token = jwt.sign(normalizer, JWT_SECRET, { expiresIn: '12h' })

            return res.status(200).json({
                ok: true,
                message: "Datos de la cuenta",
                user: token,
                token: refreshedToken,   // Si no hay refresh, será null (frontend lo ignora)
                status: STATUS_CODE.OK,
                code: 200
            });

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

export const accountUpdate = async (req, res) => {

    const { user_code } = req.user;
    const { field, value } = req.body;

    if (!user_code) {
        return res.status(400).json({
            ok: false,
            message: 'No se encontró el user_code',
            error: 'NOT_FOUND_USER_CODE',
            status: STATUS_CODE.BAD_REQUEST,
            code: 400
        });
    }

    if (!field || value === undefined) {
        return res.status(400).json({
            ok: false,
            message: 'No se recibieron los datos necesarios',
            error: 'BAD_REQUEST',
            status: STATUS_CODE.BAD_REQUEST,
            code: 400
        });
    }

    // Lista de campos permitidos para evitar inyección SQL
    const allowedFields = [
        "name_user",
        "password_user",
        "role_user"
    ];

    if (!allowedFields.includes(field)) {
        return res.status(400).json({
            ok: false,
            message: `El campo ${field} no está permitido`,
            error: 'FIELD_NOT_ALLOWED',
            status: STATUS_CODE.BAD_REQUEST,
            code: 400
        });
    }

    try {

        // Validar si el usuario existe
        const sqlValied = 'SELECT * FROM users WHERE code_user = ? LIMIT 1';
        const [valied] = await pool.query(sqlValied, [user_code]);

        if (valied.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado',
                error: 'USER_NOT_FOUND',
                status: STATUS_CODE.NOT_FOUND,
                code: 404
            });
        }

        let newValue = value;

        // Si actualiza contraseña → hash
        if (field === "password_user") {
            if (value.length < 6) {
                return res.status(400).json({
                    ok: false,
                    message: 'La contraseña debe tener mínimo 6 caracteres',
                    error: 'PASSWORD_TOO_SHORT',
                    status: STATUS_CODE.BAD_REQUEST,
                    code: 400
                });
            }

            const saltRounds = 10;
            newValue = await bcrypt.hash(value, saltRounds);
        }

        // UPDATE seguro usando field validado
        const sqlUpdate = `UPDATE users SET ${field} = ?, updated_user = NOW() WHERE code_user = ?`;

        const [update] = await pool.query(sqlUpdate, [newValue, user_code]);

        if (update.affectedRows === 0) {
            return res.status(400).json({
                ok: false,
                message: 'No se pudo actualizar el usuario',
                error: 'UPDATE_FAILED',
                status: STATUS_CODE.BAD_REQUEST,
                code: 400
            });
        }

        return res.status(200).json({
            ok: true,
            message: 'Usuario actualizado correctamente',
            updated_field: field,
            status: STATUS_CODE.OK,
            code: 200
        });

    } catch (error) {
        return res.status(500).json({
            ok: false,
            message: `Error: ${error.message}`,
            error,
            status: STATUS_CODE.SERVER_ERROR,
            code: 500
        });
    }
};

export const accountDelete = async (req, res) => {

    const { user_code } = req.user;
    const { pwd } = req.body;

    if (!user_code) {
        return res.status(400).json({
            ok: false,
            message: 'No se encontró el user_code',
            error: 'NOT_FOUND_USER_CODE',
            status: STATUS_CODE.BAD_REQUEST,
            code: 400
        });
    }

    try {
        
        const sqlValied = 'SELECT * FROM users WHERE code_user = ? LIMIT 1';
        const [valied] = await pool.query(sqlValied, [user_code]);

        if (valied.length === 0) {
            return res.status(404).json({
                ok: false,
                message: 'Usuario no encontrado',
                error: 'USER_NOT_FOUND',
                status: STATUS_CODE.NOT_FOUND,
                code: 404
            });
        }

        const user = valied[0];
        
        const passwordsMatch = await bcrypt.compare(pwd, user.password_user);
        if (!passwordsMatch) return res.status(401).json({ok: false, message: `Credenciales incorrectas`, error: 'INVALID_PASSWORD', status: STATUS_CODE.UNAUTHORIZED, code: 401});

            await pool.query('DELETE FROM users WHERE code_user = ?', [ user_code ]);

            return res.status(200).json({ok: true, message: 'Usuario eliminado', error: '', stauts: STATUS_CODE.SUCCESS, code: 200})

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
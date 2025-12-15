import bcrypt from "bcrypt";
import { pool } from "#src/db/db.js";
import { STATUS_CODE } from "#src/helpers/status_codes.js";

//table users: id_user, code_user, name_user, password_user, role_user, updated_user, date_user

export const listUser = async (req, res) => {

    const { user_code } = req.user;

    if (!user_code) return res.status(400).json({ok: false, message: 'No se encontró el user_code', error: 'NOT_FOUND_USER_CODE', status: STATUS_CODE.NOT_FOUND, code: 400})

        try {

            const [ verified ] = await pool.query('SELECT * FROM users WHERE role_user = ? AND code_user = ? LIMIT 1', ['ADMIN', user_code]);
            if (verified.length === 0) return res.status(401).json({ok: false, message: 'No tienes permisos para esta acción', error: 'USER_UNAUTHORIZED', status: STATUS_CODE.UNAUTHORIZED, code: 401})
            
                const [ users ] = await pool.query('SELECT * FROM users WHERE code_user <> ?', [user_code])
                if (users.length === 0) return res.status(404).json({ok: false, message: 'No hay usuarios en este momento.', error: 'USERS_NOT_FOUND', status: STATUS_CODE.NOT_FOUND, code: 404})

                    const normalized = users.map(row => ({
                        id: row.id_user,
                        code: row.code_user,
                        name: row.name_user,
                        role: row.role_user,
                        updated: row.updated_user,
                        created: row.date_user
                    }));

                    return res.status(200).json({
                        ok: true,
                        message: 'Usuarios obtenidos correctamente',
                        data: normalized,
                        status: STATUS_CODE.SUCCESS,
                        code: 200
                    });

        } catch (error) {
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, status: STATUS_CODE.SERVER_ERROR, code: 500})
        }

}

export const createdUser = async (req, res) => {

    const { user_code } = req.user;
    const { name, pwd, role } = req.body;

    if (!user_code) return res.status(400).json({ok: false, message: 'No se encontró el user_code', error: 'NOT_FOUND_USER_CODE', status: STATUS_CODE.NOT_FOUND, code: 400})

    const nameRegex = /^(?!\s)(?!.*\s{2})[A-Za-z0-9 ]{3,}(?<!\s)$/;
    if (!name || !nameRegex.test(name)) return res.status(400).json({ok: false, message: `Nombre de usuario no válido (mínimo 3 caracteres, solo letras y números)`, error: 'NAME_BAD_REQUEST', status: STATUS_CODE.BAD_REQUEST, code: 400});

    if (!pwd || pwd.length < 6) return res.status(400).json({ok: false, message: `La contraseña debe tener al menos 6 caracteres`, error: 'PASSWORD_BAD_REQUEST', status: STATUS_CODE.BAD_REQUEST, code: 400});

    const validRoles = ['ADMIN', 'ALMACEN', 'TIENDA'];
    if (!role || !validRoles.includes(role)) return res.status(400).json({ok: false, message: `Rol no válido. Roles permitidos: ADMIN, ALMACEN, TIENDA`, error: 'ROLE_BAD_REQUEST', status: STATUS_CODE.BAD_REQUEST, code: 400});

        try {
            
            const [ verified ] = await pool.query('SELECT * FROM users WHERE role_user = ? AND code_user = ? LIMIT 1', ['ADMIN', user_code]);
            if (verified.length === 0) return res.status(401).json({ok: false, message: 'No tienes permisos para esta acción', error: 'USER_UNAUTHORIZED', status: STATUS_CODE.UNAUTHORIZED, code: 401})

            // 1. Validar que el nombre de usuario sea único
            const [existing] = await pool.query(`SELECT id_user FROM users WHERE name_user = ? LIMIT 1`, [name]);
            if (existing.length > 0) return res.status(409).json({ok: false, message: `El nombre de usuario ya está registrado`, error: 'USERNAME_DUPLICATED', status: STATUS_CODE.CONFLICT, code: 409});

            const saltRounds = 10;
            const hashedPwd = await bcrypt.hash(pwd, saltRounds);

            const code = Date.now();
            
            // 3. Crear usuario
            const [result] = await pool.query(`INSERT INTO users (code_user, name_user, password_user, role_user, updated_user, date_user) VALUES (?, ?, ?, ?, NOW(), NOW())`, [code, name, hashedPwd, role]);
            if (result.affectedRows === 0) return res.status(409).json({ok: false, message: `No se pudo crear el usuario`, error: 'ERROR_CREATED_USER', status: STATUS_CODE.CONFLICT, code: 409})

                const date = new Date();

                const normalized = {
                    id: result.insertId,
                    code: code,
                    name: name,
                    role: role,
                    updated: date,
                    created: date
                };

                return res.status(201).json({ok: true, message: `Usuario creado correctamente`, data: normalized, status: STATUS_CODE.USER_CREATED, code: 201});

        } catch (error) {
            return res.status(500).json({ok: false, message: `Error: ${error.message}`, error: error, status: STATUS_CODE.SERVER_ERROR, code: 500})
        }

}

export const updateUser = async (req, res) => {

    const { user_code } = req.user;
    const { code, field, value } = req.body;

    if (!user_code) {
        return res.status(400).json({
            ok: false,
            message: 'No se encontró el user_code',
            error: 'NOT_FOUND_USER_CODE',
            status: STATUS_CODE.BAD_REQUEST,
            code: 400
        });
    }

    if (!code || !field || value === undefined) {
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

            const [ verified ] = await pool.query('SELECT * FROM users WHERE role_user = ? AND code_user = ? LIMIT 1', ['ADMIN', user_code]);
            if (verified.length === 0) return res.status(401).json({ok: false, message: 'No tienes permisos para esta acción', error: 'USER_UNAUTHORIZED', status: STATUS_CODE.UNAUTHORIZED, code: 401})

                // Validar si el usuario existe
                const sqlValied = 'SELECT * FROM users WHERE code_user = ? LIMIT 1';
                const [valied] = await pool.query(sqlValied, [code]);

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

                const [update] = await pool.query(sqlUpdate, [newValue, code]);

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

}

export const deleteUser = async (req, res) => {

    const { user_code } = req.user;
    const { code } = req.body;

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
        
        const [ verified ] = await pool.query('SELECT * FROM users WHERE role_user = ? AND code_user = ? LIMIT 1', ['ADMIN', user_code]);
        if (verified.length === 0) return res.status(401).json({ok: false, message: 'No tienes permisos para esta acción', error: 'USER_UNAUTHORIZED', status: STATUS_CODE.UNAUTHORIZED, code: 401})

            const [ existingUser ] = await pool.query('SELECT * FROM users WHERE code_user = ? LIMIT 1', [ code ])
            if (existingUser.length === 0) return res.status(404).json({ok: false, message: 'El usuario no existe', error: 'USER_NOT_FOUND', status: STATUS_CODE.NOT_FOUND, code: 404})

                await pool.query('DELETE FROM users WHERE code_user = ?', [code])
                return res.status(200).json({ok: true, message: 'Se eliminó al usuario', error: '', status: STATUS_CODE.SUCCESS, code: 200})

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
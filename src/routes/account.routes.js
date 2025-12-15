import { login, account, accountUpdate, accountDelete } from "#src/controllers/account.controller.js";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post('/login', login)
router.get('/', verifyToken, account)
router.put('/', verifyToken, accountUpdate)
router.delete('/', verifyToken, accountDelete)

export default router;
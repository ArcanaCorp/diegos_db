import { listUser, createdUser, updateUser, deleteUser } from "#src/controllers/user.controller.js";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.get('/list', verifyToken, listUser)
router.post('/created', verifyToken, createdUser)
router.put('/update', verifyToken, updateUser)
router.delete('/delete', verifyToken, deleteUser)

export default router;
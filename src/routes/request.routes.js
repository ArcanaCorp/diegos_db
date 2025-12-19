import { newRequest } from "#src/controllers/request.controller.js";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post('/', verifyToken, newRequest)

export default router;
import { controllerSubscribePush } from "#src/controllers/push.controller.js";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.post('/subscribe', verifyToken, controllerSubscribePush)

export default router;
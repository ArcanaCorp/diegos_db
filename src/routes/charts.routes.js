import { getSalesStats } from "#src/controllers/charts.controller.js";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import { Router } from "express";

const router = Router();

router.get('/sales', verifyToken, getSalesStats)

export default router;
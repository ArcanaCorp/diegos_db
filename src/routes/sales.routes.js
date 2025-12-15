import { getSales, registerSale } from "#src/controllers/sales.controller.js";
import { Router } from "express";

const router = Router();

router.get('/all', getSales)

router.post('/', registerSale);

export default router;
import { generateInvoice } from "#src/controllers/invoice.controller.js";
import { Router } from "express";

const router = Router();

router.post('/generate', generateInvoice);

export default router;
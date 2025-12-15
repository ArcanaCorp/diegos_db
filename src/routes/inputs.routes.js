import { getInputs } from "#src/controllers/inputs.controller.js";
import { Router } from "express";

const router = Router();

router.get('/', getInputs)

export default router;
import { getProducts } from "#src/controllers/store.controller.js";
import { Router } from "express";

const router = Router();

router.get('/products', getProducts);

export default router;
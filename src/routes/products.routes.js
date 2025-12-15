import { deleteProduct, getProducts, updateProduct } from "#src/controllers/products.controller.js";
import { Router } from "express";

const router = Router();

router.get('/all', getProducts)

router.put('/:id', updateProduct)

router.delete('/:id', deleteProduct)

export default router;
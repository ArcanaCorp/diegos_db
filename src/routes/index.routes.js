import { Router } from "express";
import { verifyToken } from "#src/middlewares/auth.middleware.js";
import accountRoutes from './account.routes.js'
import userRoutes from './users.routes.js'
import salesRoutes from './sales.routes.js'
import productRoutes from './products.routes.js'
import inputsRoutes from './inputs.routes.js'

import storeRoutes from './store.routes.js'

import pushRoutes from './push.routes.js'

import chartsRoutes from './charts.routes.js'

import invoicesRoutes from './invoice.routes.js'

import requestRoutes from './request.routes.js'

const router = Router();

router.get('/', (req, res) => {
    res.json({ok: true, message: `API is ready!!!`})
})

router.use('/account', accountRoutes)
router.use('/user', userRoutes)

router.use('/products', verifyToken, productRoutes)

router.use('/sales', salesRoutes)

router.use('/inputs', inputsRoutes)

router.use('/store', storeRoutes)

router.use('/push', pushRoutes)

router.use('/stats', chartsRoutes)

router.use('/invoice', invoicesRoutes)

router.use('/request', requestRoutes)

export default router;
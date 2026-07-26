import { Router } from 'express';
import * as vehicleController from '../controllers/vehicle.controller';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';

const router = Router();

// Every vehicle endpoint requires a valid JWT.
router.use(authenticate);

// Search must be declared before "/:id" style routes so it isn't shadowed.
router.get('/search', vehicleController.searchVehicles);

router.get('/', vehicleController.listVehicles);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);

// Admin-only: destructive / stock-increasing operations.
router.delete('/:id', requireAdmin, vehicleController.deleteVehicle);

router.post('/:id/purchase', vehicleController.purchaseVehicle);
router.post('/:id/restock', requireAdmin, vehicleController.restockVehicle);

export default router;

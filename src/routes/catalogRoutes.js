import express from 'express';
import { getPublicCars, getPublicCarById, getPublicFilterOptions } from '../controllers/catalog.controller.js';

const router = express.Router();

// Public catalog routes
router.get('/cars', getPublicCars);
router.get('/cars/:id', getPublicCarById);
router.get('/filter-options', getPublicFilterOptions);

export default router; 
import { Router } from 'express';
import { ObtenerConfiguracionUseCase } from '../../../application/use-cases/ObtenerConfiguracionUseCase';
import { ActualizarConfiguracionUseCase } from '../../../application/use-cases/ActualizarConfiguracionUseCase';

export const buildConfiguracionRouter = (
  obtener: ObtenerConfiguracionUseCase,
  actualizar: ActualizarConfiguracionUseCase
): Router => {
  const router = Router();

  router.get('/', async (_req, res, next) => {
    try {
      res.json(await obtener.execute());
    } catch (err) {
      next(err);
    }
  });

  router.put('/', async (req, res, next) => {
    try {
      const actualizado = await actualizar.execute(req.body);
      res.json(actualizado);
    } catch (err) {
      next(err);
    }
  });

  return router;
};